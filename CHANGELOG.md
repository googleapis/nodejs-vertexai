# Changelog

## [1.9.0](https://github.com/googleapis/nodejs-vertexai/compare/v1.8.1...v1.9.0) (2024-10-14)


### Features

* Add Context Cache support for ChatSessionPreview class ([#433](https://github.com/googleapis/nodejs-vertexai/issues/433)) ([f8a3bdf](https://github.com/googleapis/nodejs-vertexai/commit/f8a3bdf55b6ee694a8fd41df29bdba54d7f8cdc2))


### Documentation

* update README ([a052132](https://github.com/googleapis/nodejs-vertexai/commit/a052132b91bad5ee9a42c6fe2057afceab36b542))

## [1.8.1](https://github.com/googleapis/nodejs-vertexai/compare/v1.8.0...v1.8.1) (2024-09-25)


### Bug Fixes

* Fix cached contents list url ([2c4b769](https://github.com/googleapis/nodejs-vertexai/commit/2c4b7692e369385e5cd82a9b753d037d31e4e8ce))

## [1.8.0](https://github.com/googleapis/nodejs-vertexai/compare/v1.7.0...v1.8.0) (2024-09-18)


### Features

* Add CachedContent resource to Vertex AI client library. ([8c8963e](https://github.com/googleapis/nodejs-vertexai/commit/8c8963e5c62bf491d5a47f7c5a0db64fafaea0cd))
* Implement cached_content with generateContent methods ([c604b8c](https://github.com/googleapis/nodejs-vertexai/commit/c604b8caf4138537b38bdf9f57e8086d55216981))

## [1.7.0](https://github.com/googleapis/nodejs-vertexai/compare/v1.6.0...v1.7.0) (2024-08-30)


### Features

* Add GoogleApi error in ClientError.cause ([d5c67bd](https://github.com/googleapis/nodejs-vertexai/commit/d5c67bdbb7d40f0c8eecca505c90bac21e4fe36d))

## [1.6.0](https://github.com/googleapis/nodejs-vertexai/compare/v1.5.0...v1.6.0) (2024-08-26)


### Features

* Add responseSchema to GenerateContentRequest. ([d3715da](https://github.com/googleapis/nodejs-vertexai/commit/d3715daa793fda8063b379d16a0bf844a90b4087))
* Add tool config ([f618132](https://github.com/googleapis/nodejs-vertexai/commit/f618132b7b5f9a05ba32b5968ccec14c9c18baaa))

## [1.5.0](https://github.com/googleapis/nodejs-vertexai/compare/v1.4.1...v1.5.0) (2024-08-21)


### Features

* missing property frequencyPenalty in type defintions ([#394](https://github.com/googleapis/nodejs-vertexai/issues/394)) ([7557a83](https://github.com/googleapis/nodejs-vertexai/commit/7557a839b96a9fddc17c6516dd9c8c12772b6c59))

## [1.4.1](https://github.com/googleapis/nodejs-vertexai/compare/v1.4.0...v1.4.1) (2024-08-09)


### Bug Fixes

* Fix docstring order and add node version badge in README ([d330fe3](https://github.com/googleapis/nodejs-vertexai/commit/d330fe3352713226794ac3e8c7a7a21474a32ec1))

## [1.4.0](https://github.com/googleapis/nodejs-vertexai/compare/v1.3.0...v1.4.0) (2024-07-15)


### Features

* support responseMimeType in GenerationConfig to allow users specify output response mimetype of the generated candidate text. ([93f6d70](https://github.com/googleapis/nodejs-vertexai/commit/93f6d70660dbee44f81766544047da7baf427e30))


### Bug Fixes

* handle case when content is undefined in candidate. ([f16f040](https://github.com/googleapis/nodejs-vertexai/commit/f16f0405c0419152119385780ba21b2d9c18dc9b))

## [1.3.0](https://github.com/googleapis/nodejs-vertexai/compare/v1.2.0...v1.3.0) (2024-06-26)


### Features

* infer project ID when user don't specify and throw if inference fails ([6b3e68e](https://github.com/googleapis/nodejs-vertexai/commit/6b3e68e3b869659d17ef584995de7d7bfc1b1f3b))


### Bug Fixes

* improve error message to help with debugging ([8a937d5](https://github.com/googleapis/nodejs-vertexai/commit/8a937d5f534f54867fd62a988dbd84ebafb5b76a))

## [1.2.0](https://github.com/googleapis/nodejs-vertexai/compare/v1.1.0...v1.2.0) (2024-05-22)


### Features

* allow users to pass string as system instruction ([a824162](https://github.com/googleapis/nodejs-vertexai/commit/a824162a29b8c6ba3ccae46c492dd28e9c2baf9c))
* enable inference request to tuned model. ([de9c4c2](https://github.com/googleapis/nodejs-vertexai/commit/de9c4c2f8c63a298bd28ab69dae9b6a5d72c20d7))
* infer location if user doesn't specifies it. ([b8d4af1](https://github.com/googleapis/nodejs-vertexai/commit/b8d4af1bb990e95093f446c808194bfc4fe53287))
* support RAG in public preview ([5ade755](https://github.com/googleapis/nodejs-vertexai/commit/5ade7551fe0dbab54bc56f251c32bf3b7802c2c5))
* update grounding metadata ([d3c0a64](https://github.com/googleapis/nodejs-vertexai/commit/d3c0a647248be6be49b6b93a18aad79c10bae6c4))


### Bug Fixes

* log instead of throw appendHistory errors to avoid unhandled rejection ([2ec9e7d](https://github.com/googleapis/nodejs-vertexai/commit/2ec9e7d5519af438eb03b9f21f90b86f2575ac47))

## [1.1.0](https://github.com/googleapis/nodejs-vertexai/compare/v1.0.0...v1.1.0) (2024-04-13)


### Features

* enable system instruction for GenerativeModel ([590ca5a](https://github.com/googleapis/nodejs-vertexai/commit/590ca5a055e65b493c7d20f3983173dc8a8cbc39))
* enable system instruction in chat experience ([7e71f75](https://github.com/googleapis/nodejs-vertexai/commit/7e71f750104cf14f465bb8091f851b5692f5aea9))
* exposing customHeader in requestOptions to allow users pass in customer headers. ([b47d733](https://github.com/googleapis/nodejs-vertexai/commit/b47d733680837233b4323f4113737421099df02b))

## [1.0.0](https://github.com/googleapis/nodejs-vertexai/compare/v0.5.0...v1.0.0) (2024-04-04)


### Features

* added userAgent option to RequestOptions to allow setting User-Agent header ([ca43e2f](https://github.com/googleapis/nodejs-vertexai/commit/ca43e2f0b4ebef60d3739b10a3707cdfe2e2a4ec))
* include grounding metadata to stream aggregated response. ([d32755e](https://github.com/googleapis/nodejs-vertexai/commit/d32755e41ca36a52bfd55dafd45bf5a1a8835b7b))
* Support functionCalls property in GenerationContentCandidate interface for non streaming mode ([89568a6](https://github.com/googleapis/nodejs-vertexai/commit/89568a654550f51ed7e280eb6108f6bdb13e7a92))


### Bug Fixes

* check optional field in aggregate response ([f7718ae](https://github.com/googleapis/nodejs-vertexai/commit/f7718aec22f2806bfda18cc75d2ba2c47c929efe))
* correct CitationMetadata interface. refactor nested function ([722b7fd](https://github.com/googleapis/nodejs-vertexai/commit/722b7fda23fd03e85b418e71cfacf2206596fc86))
* correct code snippets in README ([bdcc5fd](https://github.com/googleapis/nodejs-vertexai/commit/bdcc5fdda9325c37a2efcfc9c00e8cf90fae1f46))
* correct GenerateContentCandidate interface and GenerateContentResponse interface ([7a366ab](https://github.com/googleapis/nodejs-vertexai/commit/7a366abfc13b87e93bc233e045b8e173ae6357b5))
* correct sys test logic on stream endpoint for funcion calling ([1fd5b72](https://github.com/googleapis/nodejs-vertexai/commit/1fd5b725a6537ddca0b93c34be04a4ad8f9f50b6))
* Fix a bug in the Vertex AI client library. ([8ad7dfb](https://github.com/googleapis/nodejs-vertexai/commit/8ad7dfbd7090868ed89a155aa9519ed220c23451))
* fix bug in safetyRatings handling, fix incomplete content interfaces, and add unit test for stream response handling ([e573ce6](https://github.com/googleapis/nodejs-vertexai/commit/e573ce68bda3fabdc75ffbacc56421215cbe2f70))
* for function call, role should be model. ([3b80dc8](https://github.com/googleapis/nodejs-vertexai/commit/3b80dc86b8c5d1e4be0afe99bca35201fd812abb))
* functionResponse should be user role ([d092ab4](https://github.com/googleapis/nodejs-vertexai/commit/d092ab4bb0862fc8471e663a4fb7084b432baf74))
* Make appendHistory private. ([a1bedcd](https://github.com/googleapis/nodejs-vertexai/commit/a1bedcdb6fe71d73a7601c4fafda699b0b8d1698))
* pass tools from getGenerativeModel and startChat methods to top level functions ([bbaf78a](https://github.com/googleapis/nodejs-vertexai/commit/bbaf78a5286ca39074b72bcce7eb7856fe0bec70))
* pass tools from getGenerativeModel to chatSession. ([907ad74](https://github.com/googleapis/nodejs-vertexai/commit/907ad74aefe24082607431c34027df6ae6d46a08))
* remove any type in token signature ([add084c](https://github.com/googleapis/nodejs-vertexai/commit/add084c6c1657f92a43c102159abceb0b7121b0c))
* remove defaulting value of candidates in unary api. remove unused variables and imports. remove throwing GoogleAIError when candidates undefined or empty. ([6c0c31c](https://github.com/googleapis/nodejs-vertexai/commit/6c0c31c2d798f32739fb0d8b647d4289168cc446))
* replace any type with explicit types in post fetch processing functions ([4099129](https://github.com/googleapis/nodejs-vertexai/commit/4099129d8497ec39fd1410e3edfc7599f2a91db8))
* replace snake_case in docs to camelCase ([5893581](https://github.com/googleapis/nodejs-vertexai/commit/5893581b17b9f1df28410f1315c2fd760acc98b6))
* SDK should be released to 1.0.0 ([4cab5fd](https://github.com/googleapis/nodejs-vertexai/commit/4cab5fd814bb0c47c98b5be2ed250f5a3765cd6e))
* update finish reason enum list to be complete ([f16b2e7](https://github.com/googleapis/nodejs-vertexai/commit/f16b2e778f1c0d250404928d85f12e775fc0f720))
* update prompt feedback interface ([0d3754a](https://github.com/googleapis/nodejs-vertexai/commit/0d3754ac7c51b73281342cdb20b22af5918045fa))

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
