import * as http from 'http';
import * as https from 'https';


class HTTPServer {

    constructor(options, handler) {

        this.handler = handler;

        let { port, host } = options;

        this.server = http.Server().listen({ port, host });

        this.server.addListener('request', this.handler);
    }
}

function route(matcher) {

    return function (...routes) {

        return async function (subject) {

            let match = await matcher(subject);

            if (match === true) {

                if (routes.length == 0) {
                    //  The object matched and this is a terminating route; hence, return true.
                    return true;
                }
                else {

                    for (let route of routes) {

                        let pass = await route(subject);

                        if (pass === true || pass === null || pass === undefined) {
                            //  The routing has succeeded and terminated successfully; hence, return success.
                            return true;
                        }
                    }

                    return false;
                    //  A route match was not found; hence, return a failed routing.
                }
            }
            else if (match === false || match === null || match === undefined) {
                return match;
            }
        }
    }
}


try {

    let host = route(() => true);
    let get = route((sub) => sub.req.method == 'GET');
    let post = route((sub) => sub.req.method == 'POST');
    let api = route((sub) => sub.req.path == 'api');
    let succeed = route((sub) => { sub.res.end('succeed') });
    let error = route((sub) => { throw new Error() });
    let resource = route((sub) => sub.req.path == 'resource');
    let authenticator = route(() => true);

    let root = host(
        get(
            authenticator(
                api(
                    succeed()
                ),
                resource(
                    error()
                )
            )
        ),
        post(
            authenticator(
                api(),
                resource()
            )
        )
    );

    // let httpServer = new HTTPServer({ 'port': 8000, 'host': 'localhost' }, async (req, res) => {

    //     try {

    //         await router({ req, res });
    //     }
    //     catch (e) {

    //         console.error(e);
    //     }
    // });

    (async function () {

        try {

            let sub1 = {
                req: {
                    method: 'GET',
                    path: 'api'
                },
                res: {
                    end: function (message) {
                        console.log(message);
                    }
                }
            }

            await root(sub1);

            let sub2 = {
                req: {
                    method: 'GET',
                    path: 'resource'
                },
                res: {
                    end: function (message) {
                        console.log(message);
                    }
                }
            }

            await root(sub2);
        }
        catch (e) {

            console.error(e);
        }
    })();
}
catch (e) {
    console.error(e);
    throw (e);
}

