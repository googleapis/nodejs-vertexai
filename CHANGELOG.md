# Changelog

## [0.2.0](https://github.com/googleapis/nodejs-vertexai/compare/v0.1.3...v0.2.0) (2024-01-03)


### Features

* allow user to pass "models/model-ID" to instantiate model ([e94b285](https://github.com/googleapis/nodejs-vertexai/commit/e94b285dac6aaf0c77c6b9c6220b29b8d4aced52))
* include all supported authentication options ([257355c](https://github.com/googleapis/nodejs-vertexai/commit/257355ca09ee298623198404a4f889f5cf7788ee))


### Bug Fixes

* fix bug on blocking streaming in send message ([a675e46](https://github.com/googleapis/nodejs-vertexai/commit/a675e465dd86249b7e8ce7ff91af1e244bcb827e))
* fix header ([04a32e6](https://github.com/googleapis/nodejs-vertexai/commit/04a32e6466ce445e8d76a7dea6b6cc2607b93d3b))
* fix system test messages and sendMessageStream test. ([3713903](https://github.com/googleapis/nodejs-vertexai/commit/37139030a2de798994dbd238d6d27546260fc1f2))
* fix user agent in header ([8cee1b5](https://github.com/googleapis/nodejs-vertexai/commit/8cee1b5ae3f69cf81d8fd0e42bcb08c47c7be8a9))
* processing of streams, including UTF ([63ce032](https://github.com/googleapis/nodejs-vertexai/commit/63ce032461a32e9e5fdf04d8ce2d4d8628d691b1))
* remove placeholder cache attribute of access token ([3ec92e7](https://github.com/googleapis/nodejs-vertexai/commit/3ec92e71a9f7ef4a55bf64037f363ec6be6a729d))
* safety return types ([449c7a2](https://github.com/googleapis/nodejs-vertexai/commit/449c7a2af2272add956eb44d8e617878468af344))
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
