import m from "mithril";
// import { container } from "tsyringe";
import { ROUTES } from "./routes";
import { HomePage } from "./HomePage";
import { Layout } from "./common/Layout";

const DEFAULT_ROUTE = ROUTES.home;

const routeDefs: m.RouteDefs = {};

function pageRoute(pageComponent: m.Component<any, any>): m.RouteResolver {
  return {
    // args: params extracted to object
    // path: the full path being resolved
    // route: the route string from ROUTES
    onmatch: (args, path, route) => {
      // // console.log(`onmatch: args: ${JSON.stringify(args)}; path: ${path}; route: ${route}`);
      // titleSvc.setRouteTitle(route);
    },
    render: (vnode) => m(Layout, m(pageComponent)),
  };
}

routeDefs[ROUTES.home] = pageRoute(HomePage);


const appEl = document.querySelector<HTMLDivElement>('#app')!;
m.route(appEl, DEFAULT_ROUTE, routeDefs);
