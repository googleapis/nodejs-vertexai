/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  createProgram,
  ScriptTarget,
  ModuleKind,
  isInterfaceDeclaration,
  isIdentifier,
  TypeChecker,
  // eslint-disable-next-line n/no-unpublished-import
} from 'typescript';
import {strict as assert} from 'assert';
import * as fs from 'fs';
import * as path from 'path';

interface PropertySignature {
  name: string;
  type: string;
  optional: boolean;
}

interface InterfaceSignature {
  name: string;
  properties: PropertySignature[];
}

type InterfaceByName = {[key: string]: InterfaceSignature};

function getTypeScriptFilesFromDirs(dirs: string[]): string[] {
  let files: string[] = [];
  dirs.forEach(dir => {
    const absoluteDir = path.resolve(dir);
    const dirFiles = fs
      .readdirSync(absoluteDir)
      .filter(file => file.endsWith('.ts'))
      .map(file => path.join(absoluteDir, file));
    files = files.concat(dirFiles);
  });
  return files;
}

function getInterfaceProperties(
  interfaceType: any,
  checker: TypeChecker
): PropertySignature[] {
  const properties = checker.getPropertiesOfType(interfaceType);
  return properties.map(property => {
    const propertyType = checker.getTypeOfSymbolAtLocation(
      property,
      property.valueDeclaration!
    );
    const propertyName = property.getName();
    const propTypeName = checker.typeToString(propertyType);
    const isOptional =
      (property.valueDeclaration as any).questionToken !== undefined;
    return {name: propertyName, type: propTypeName, optional: isOptional};
  });
}

function isPropertyMatch(
  sdkProperties: PropertySignature[],
  contractProperties: PropertySignature[]
): boolean {
  for (const contractProperty of contractProperties) {
    const sdkProperty = sdkProperties.find(
      property => property.name === contractProperty.name
    );

    if (!sdkProperty) {
      return false;
    }

    if (contractProperty.optional !== sdkProperty.optional) {
      return false;
    }

    if (sdkProperty.type !== contractProperty.type) {
      return false;
    }
  }

  return true;
}

function getInterfacesFromSourceFile(
  sourceFile: any,
  checker: TypeChecker
): InterfaceByName {
  const interfaces: InterfaceByName = {};

  const visit = (node: any) => {
    if (isInterfaceDeclaration(node) && isIdentifier(node.name)) {
      const interfaceName = node.name.text;
      const symbol = checker.getSymbolAtLocation(node.name);
      if (symbol) {
        const interfaceType = checker.getDeclaredTypeOfSymbol(symbol);
        const properties = getInterfaceProperties(interfaceType, checker);
        interfaces[interfaceName] = {name: interfaceName, properties};
      }
    }
    node.forEachChild(visit);
  };

  visit(sourceFile);
  return interfaces;
}

export function interfaceTestEngine(
  sdkName: string,
  sdkInterfaceDirs: string[],
  contractInterfaceFiles: string[]
) {
  const fileNames = contractInterfaceFiles.concat(
    getTypeScriptFilesFromDirs(sdkInterfaceDirs)
  );
  console.info(`${sdkName}: file names in the program: ${fileNames}`);
  const program = createProgram(fileNames, {
    target: ScriptTarget.ES2015,
    module: ModuleKind.ESNext,
  });
  const checker = program.getTypeChecker();

  const sourceFiles = program
    .getSourceFiles()
    .filter(sf => !sf.isDeclarationFile);
  let sdkInterfaces: InterfaceByName = {};
  let contractInterfaces: InterfaceByName = {};

  sourceFiles.forEach(sourceFile => {
    const fileName = sourceFile.fileName;
    const absoluteFileName = path.resolve(fileName);
    if (sdkInterfaceDirs.some(dir => absoluteFileName.startsWith(dir))) {
      const thisSDKInterfaces = getInterfacesFromSourceFile(
        sourceFile,
        checker
      );
      sdkInterfaces = {
        ...sdkInterfaces,
        ...thisSDKInterfaces,
      };
    } else if (
      contractInterfaceFiles.some(file => absoluteFileName.startsWith(file)) &&
      absoluteFileName.endsWith('interface_contract.ts')
    ) {
      const thisContractInterfaces = getInterfacesFromSourceFile(
        sourceFile,
        checker
      );
      contractInterfaces = {
        ...contractInterfaces,
        ...thisContractInterfaces,
      };
    }
  });

  Object.keys(contractInterfaces).forEach(interfaceName => {
    console.info(`${sdkName}: checking ${interfaceName}`);
    const contractInterface = contractInterfaces[interfaceName];
    const sdkInterface = sdkInterfaces[interfaceName];
    assert(
      sdkInterface,
      `${sdkName}: could not find ${interfaceName} interfaces`
    );
    assert(
      isPropertyMatch(sdkInterface.properties, contractInterface.properties),
      `${sdkName}: interface ${JSON.stringify(sdkInterface)} does not match the contract ${JSON.stringify(contractInterface)}`
    );
  });
}
