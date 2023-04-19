import m from "mithril";

export const Header: m.Component<{}> = {
  view() {
    return m(".fixed.h-12.px-4.flex.items-stretch", {
      class: `bg-primary text-primary-contrast text-lg font-semibold`,
      style: `left: 0; right: 0;`,
    }, [

      m(".flex.items-center", "Cass"),

    ]);
  }
};
