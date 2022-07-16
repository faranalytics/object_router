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

        return async function (obj) {

            let match = await matcher(obj);

            if (match === true) {

                if (routes.length == 0) {
                    //  The object matched and this is a terminating route; hence, return true.
                    return true;
                }
                else {

                    for (let route of routes) {

                        let pass = await route(obj);

                        if (pass === true) {
                            //  The routing has succeeded and terminated successfully; hence, return success.
                            return true;
                        }
                    }

                    return false;
                    //  A route match was not found; hence, return a failed routing.
                }
            }
            else {
                return false;
            }
        }
    }
}


try {

    let host = route(() => true);
    let get = route((obj) => obj.req.method == 'GET');
    let post = route((obj) => obj.req.method == 'POST');
    let api = route((obj) => obj.res.end('test'));
    let resource = route(() => true);
    let authenticator = route(() => true);

    let router = host(
        get(
            authenticator(
                api(),
                resource()
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

            let obj = {
                req: {
                    method: 'GET'
                },
                res: {
                    end: function(message) {
                        
                        console.log(message);
                    }
                }
            }

            await router(obj);
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

