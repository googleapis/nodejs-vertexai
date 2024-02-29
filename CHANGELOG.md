# Changelog

## [0.5.0](https://github.com/googleapis/nodejs-vertexai/compare/v0.4.0...v0.5.0) (2024-02-29)


### Features

* Introduce Request Timeout Configuration ([1b37f40](https://github.com/googleapis/nodejs-vertexai/commit/1b37f4045f604dac10c91ba800b34c6beadd113a))


### Bug Fixes

* correct UsageMetadata schema ([10bc676](https://github.com/googleapis/nodejs-vertexai/commit/10bc67666a64d6ea7dd103c3dae678b8080735c1))
* include usageMetadata in stream aggregated response ([a1154c9](https://github.com/googleapis/nodejs-vertexai/commit/a1154c9a91bb5d9cd988a00be4b462ee013fa704))

## [0.4.0](https://github.com/googleapis/nodejs-vertexai/compare/v0.3.1...v0.4.0) (2024-02-15)


### Features

* Added support for Grounding ([929df39](https://github.com/googleapis/nodejs-vertexai/commit/929df39f19f423bcfaf35ef113ce04886345a6ab))
* enable both GA and preview namespaces. ([1c2aca6](https://github.com/googleapis/nodejs-vertexai/commit/1c2aca6b776784a5b51d1654ffa41dc36f600874))


### Bug Fixes

* throw more details on error message. ([5dba79c](https://github.com/googleapis/nodejs-vertexai/commit/5dba79c3648203b9a66b6098f9f1fa0280e6e67d))
* unary api should only need to `await` once. ([67a2e96](https://github.com/googleapis/nodejs-vertexai/commit/67a2e9649c69a2cf9868a074527efd93d2c800c9))

## [0.3.1](https://github.com/googleapis/nodejs-vertexai/compare/v0.3.0...v0.3.1) (2024-02-06)


### Bug Fixes

* decouple dependency between VertexAI_Preivew and GenerativeModel classes ([6762c99](https://github.com/googleapis/nodejs-vertexai/commit/6762c995bfa1bfdb740ed01a2eb4385126b0e36a))
* Switch NodeJS generateContent to call Unary API endpoint ([e4edb59](https://github.com/googleapis/nodejs-vertexai/commit/e4edb599863c23a896e263ba2639c80481a65543))

## [0.3.0](https://github.com/googleapis/nodejs-vertexai/compare/v0.2.1...v0.3.0) (2024-01-30)


### Features

* add function calling support ([1deb4e9](https://github.com/googleapis/nodejs-vertexai/commit/1deb4e920205d2fff6da780175de6045bd853885))


### Bug Fixes

* throw error when GoogleAuthOptions.scopes doesn't include required scope. ([558aee9](https://github.com/googleapis/nodejs-vertexai/commit/558aee98d76192b4a63b3d28abba3f3d4cda1762))
* throws instructive client side error message when bad request happens for function calling ([c90203d](https://github.com/googleapis/nodejs-vertexai/commit/c90203d153407daa08763c273a827a5e9db54a70))

## [0.2.1](https://github.com/googleapis/nodejs-vertexai/compare/v0.2.0...v0.2.1) (2024-01-05)


### Bug Fixes

* enable passing only a string to generateContent and generateContentStream ([c50811e](https://github.com/googleapis/nodejs-vertexai/commit/c50811e5443848edb8f9ce5d88ae4c6c8b59b65b))


## [0.2.0](https://github.com/googleapis/nodejs-vertexai/compare/v0.1.3...v0.2.0) (2024-01-03)


### Features

* allow user to pass "models/model-ID" to instantiate model ([e94b285](https://github.com/googleapis/nodejs-vertexai/commit/e94b285dac6aaf0c77c6b9c6220b29b8d4aced52))
* include all supported authentication options ([257355c](https://github.com/googleapis/nodejs-vertexai/commit/257355ca09ee298623198404a4f889f5cf7788ee))


### Bug Fixes

* processing of streams, including UTF ([63ce032](https://github.com/googleapis/nodejs-vertexai/commit/63ce032461a32e9e5fdf04d8ce2d4d8628d691b1))
* remove placeholder cache attribute of access token ([3ec92e7](https://github.com/googleapis/nodejs-vertexai/commit/3ec92e71a9f7ef4a55bf64037f363ec6be6a729d))
* update safety return types ([449c7a2](https://github.com/googleapis/nodejs-vertexai/commit/449c7a2af2272add956eb44d8e617878468af344))
* throw ClientError or GoogleGenerativeAIError according to response status so that users can catch them and handle them according to class name. ([ea0dcb7](https://github.com/googleapis/nodejs-vertexai/commit/ea0dcb717be8d22d98916252ccee352e9af4a09f))

## [0.1.3](https://github.com/googleapis/nodejs-vertexai/compare/v0.1.2...v0.1.3) (2023-12-13)


### Bug Fixes

* Add samples link to readme ([3a86e85](https://github.com/googleapis/nodejs-vertexai/commit/3a86e85de034479818813e563cef6badd68074ab))
* update header field ([eab8841](https://github.com/googleapis/nodejs-vertexai/commit/eab8841f42679e976d4b1eca8dc083330380daff))

## [0.1.2](https://github.com/googleapis/nodejs-vertexai/compare/v0.1.1...v0.1.2) (2023-12-13)


### Bug Fixes

* update readme ([b01bd39](https://github.com/googleapis/nodejs-vertexai/commit/b01bd391a34f7b7b65d8e267ca169f52f5a48217))

## [0.1.1](https://github.com/googleapis/nodejs-vertexai/compare/v0.1.0...v0.1.1) (2023-12-12)


### Bug Fixes

* fix stream send message content ([ad1e17e](https://github.com/googleapis/nodejs-vertexai/commit/ad1e17e81c72ce55d395bcae36326d48d595d175))

## 0.1.0 (2023-12-12)


### Features

* add streamGenerateContent method ([6263800](https://github.com/googleapis/nodejs-vertexai/commit/626380039d7bb2fb9af9219f70ad549950b5f490))
* add streamSendMessage method ([598b1dd](https://github.com/googleapis/nodejs-vertexai/commit/598b1dd7ca8d84c9b32e633a65634abea232f7de))
* add generateContent method ([d7f1f0f](https://github.com/googleapis/nodejs-vertexai/commit/d7f1f0f66b7bf22c2cb59a8ef698b426cf7e3b8b))
* add countTokens method ([e0265a3](https://github.com/googleapis/nodejs-vertexai/commit/e0265a36d73b460c66062a0b520b5556d0aa894b))
