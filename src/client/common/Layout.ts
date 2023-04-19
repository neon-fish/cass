import m from "mithril";
import { Header } from "./Header";
import { Footer } from "./Footer";

export const Layout: m.Component<{}> = {

  view({ children }) {
    return m(".flex.flex-col.min-h-screen", [

      m(Header),

      // Header height to allow for floating header
      m(".pt-12.flex-1", [
        children
      ]),

      m(Footer),

    ]);
  }

};
