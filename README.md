![Test library workflow status](https://github.com/tcort/link-check/workflows/Test%20library/badge.svg)

ℹ️ Fork of [tcort](https://github.com/tcort/link-check) repository (version 4.5.2), with several improvements:
- completely rewritten in typescript
- see [CHANGELOG.md](./CHANGELOG.md) since v4.5.2 to get full list of improvements

# link-check

Checks whether a hyperlink is alive (`200 OK`) or dead.

## Installation

    npm install --save link-check

## Specification

A link is said to be 'alive' if an HTTP HEAD or HTTP GET for the given URL
eventually ends in a `200 OK` response. To minimize bandwidth, an HTTP HEAD
is performed. If that fails (e.g. with a `405 Method Not Allowed`), an HTTP
GET is performed. Redirects are followed.

In the case of `mailto:` links, this module validates the e-mail address
using [isemail](https://www.npmjs.com/package/isemail).

## API

### linkCheck(link, [opts,] callback)

Given a `link` and a `callback`, attempt an HTTP HEAD and possibly an HTTP GET.

Parameters:

 * `url` string containing a URL.
 * `opts` optional options object containing any of the following optional fields:
   * `baseUrl` the base URL for relative links.
   * `timeout` timeout in [zeit/ms](https://www.npmjs.com/package/ms) format. (e.g. `"2000ms"`, `20s`, `1m`). Default `10s`.
   * `aliveStatusCodes` an array of numeric HTTP Response codes which indicate that the link is alive. Entries in this array may also be regular expressions. Example: `[ 200, /^[45][0-9]{2}$/ ]`.  Default `[ 200 ]`.
   * `headers` a string based attribute value object to send custom HTTP headers. Example: `{ 'Authorization' : 'Basic Zm9vOmJhcg==' }`.
   * `retryOn429` a boolean indicating whether to retry on a 429 (Too Many Requests) response. When true, if the response has a 429 HTTP code and includes an optional `retry-after` header, a retry will be attempted after the delay indicated in the `retry-after` header. If no `retry-after` header is present in the response or the `retry-after` header value is not valid according to [RFC7231](https://tools.ietf.org/html/rfc7231#section-7.1.3) (value must be in seconds), a default retry delay of 60 seconds will apply. This default can be overriden by the `fallbackRetryDelay` parameter.
   * `retryOnError` a boolean indicating whether to retry on error (not an error status code). Default is `false`.
   * `retryCount` the number of retries to be made on a 429 response. Default `2`.
   * `fallbackRetryDelay` the delay in [zeit/ms](https://www.npmjs.com/package/ms) format. (e.g. `"2000ms"`, `20s`, `1m`) for retries on a 429 response when no `retry-after` header is returned or when it has an invalid value. Default is `60s`.
   * `debug` enable debug
   * `debugToStdErr` write debug message to standard error output
 * `callback` function which accepts `(err, result)`.
   * `err` an Error object when the operation cannot be completed, otherwise `null`.
   * `result` an object with the following properties or `undefined`:
     * `link` the `link` provided as input
     * `status` a string set to either `alive` or `dead`.
     * `statusCode` the HTTP status code. Set to `0` if no HTTP status code was returned (e.g. when the server is down).
     * `err` any connection error that occurred, otherwise `undefined`.
     * `additionalMessages` a list of additional messages that occured, otherwise `undefined`.

## Examples

Javascript:

```js
'use strict';

const linkChecker = require('link-check');

linkCheck.linkCheck('http://example.com', function (err, result) {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`${result.link} is ${result.status}`);
});
```

Typescript: 

```ts
import { linkCheck, Options, LinkCheckResult } from 'link-check'

const options: Options = {
    timeout: '5s',
}

linkCheck('http://example.com', options, (err: any, result: LinkCheckResult) => {
    if (err) {
        console.error(err)
        return
    }
    console.log(`${result.link} is ${result.status}`)
})
```

One-liner test from shell

```bash
node -e 'require("link-check").linkCheck("https://www.shellcheck.net", {debug: true, timeout: "5s"}, function (err, result) { console.log(result)})'
```


**With basic authentication:**

```js
'use strict';

const linkChecker = require('link-check');

linkChecker.linkCheck('http://example.com', { headers: { 'Authorization': 'Basic Zm9vOmJhcg==' } }, function (err, result) {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`${result.link} is ${result.status}`);
});
```

## Testing

```bash
npm test
```

## License

See [LICENSE.md](https://github.com/tcort/link-check/blob/master/LICENSE.md)
