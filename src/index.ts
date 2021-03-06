import * as url from 'url'
import { Callback, Options, Protocol } from './lib/types'
import { LinkCheckResult, Status } from './lib/LinkCheckResult'
import { FileProtocol } from './lib/proto/file'
import { HttpProtocol } from './lib/proto/http'
import { MailToProtocol } from './lib/proto/mailto'
import { debug } from './lib/debug'

export { Options, Callback }
export { LinkCheckResult, Status }

const protocols: { [key: string]: Protocol } = {
    file: FileProtocol,
    http: HttpProtocol,
    https: HttpProtocol,
    mailto: MailToProtocol,
}

export function linkCheck(
    link: string,
    optionsArg: Options | Callback<LinkCheckResult>,
    callbackArg?: Callback<LinkCheckResult>,
): void {
    let options: Options
    let callback: Callback<LinkCheckResult>

    if (arguments.length === 2 && typeof optionsArg === 'function') {
        // optional 'opts' not supplied.
        callback = optionsArg as Callback<LinkCheckResult>
        options = {}
    } else if (arguments.length === 3 && callbackArg) {
        callback = callbackArg
        options = optionsArg as Options
    } else {
        throw new Error('Unexpected arguments')
    }
    doLnkCheck(link, options, callback)
}

function doLnkCheck(link: string, options: Options, callback: Callback<LinkCheckResult>): void {
    if (options.debug) {
        debug(options.debugToStdErr, 0, `[LINK] Check link "${link}", options= ${JSON.stringify(options)}`)
    }
    // get protocol from link when link is not relative
    let protocol = url.parse(link, false, true).protocol

    if (!protocol) {
        // link is relative
        // get protocol from base url when link is not relative
        if (options.baseUrl) {
            protocol = url.parse(options.baseUrl, false, true).protocol
            if (!protocol) {
                const err = new Error(
                    `Relative path could not be checked because protocol could not be determined from baseUrl options "${options.baseUrl}"`,
                )
                if (options.debug) {
                    debug(options.debugToStdErr, 0, `[LINK] ERROR`, err)
                }
                callback(err)
                return
            }
        } else {
            const err = new Error('Relative path could not be checked when baseUrl options is not set')
            if (options.debug) {
                debug(options.debugToStdErr, 0, `[LINK] ERROR`, err)
            }
            callback(err)
            return
        }
    }

    protocol = protocol.replace(/:$/, '')
    if (!Object.prototype.hasOwnProperty.call(protocols, protocol)) {
        const err = new Error(`Unsupported Protocol ${protocol}`)
        if (options.debug) {
            debug(options.debugToStdErr, 0, `[LINK] ERROR`, err)
        }
        callback(err)
        return
    }
    const startTime = new Date().getTime()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protocols[protocol].check(link, options, (err: any, result?: LinkCheckResult) => {
        const endTime = new Date().getTime()
        const durationInMs = endTime - startTime
        let linkResult
        if (err) {
            linkResult = new LinkCheckResult(link, 0, Status.ERROR, err)
        } else {
            if (!result) {
                callback(new Error('Unexpected undefined result'))
                return
            }
            linkResult = result
        }
        linkResult.stats.durationInMs = durationInMs
        if (options.debug) {
            debug(options.debugToStdErr, 0, `[LINK] Result: ${JSON.stringify(linkResult)}`)
        }
        callback(null, linkResult)
    })
}
