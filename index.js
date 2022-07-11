
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

function route(matcher, handler) {

    class Route {
        constructor() {
            this.handle = this.handle.bind(this);
            this.routes = [];
        }

        async handle(obj) {
            if (typeof matcher == 'function') {
                if (await matcher(obj)) {
                    if (typeof handler == 'function') {
                        if (await handler(obj)) {
                            for (let i = 0; i < this.routes.length; i += 1) {
                                if (typeof this.routes[i] == 'object' && this.routes[i]) {
                                    if (await this.routes[i].handle(obj)) {
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    return true;
                }
                else {
                    return false;
                }
            }

        }
    }

    return function (...args) {

        let route = new Route();
        route.routes = route.routes.concat([...args]);
        return route;
    }
}


try {

    let host = route(() => true, (obj) => true);
    let get = route((obj) => obj.req.method == 'GET', () => true);
    let post = route((obj) => obj.req.method == 'POST', () => true);
    let api = route(() => true, (obj) => obj.res.end('test'));
    let resource = route(() => true, () => true);
    let authenticator = route(() => true, () => true);

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

    let httpServer = new HTTPServer({ 'port': 8000, 'host': 'localhost' }, async (req, res) => {

        try {
            await router.handle({ req, res });
        }
        catch (e) {
            console.error(e);
        }
    });
}
catch (e) {

    console.error(e);
    throw (e);
}

