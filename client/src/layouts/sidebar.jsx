import { forwardRef } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/utils/cn";
import { navbarLinksEtudiant, navbarLinksProf } from "@/constants";
import PropTypes from "prop-types";
import logoLight from "@/assets/logo-light.svg";
import logoDark from "@/assets/logo-dark.svg";
import { useContext } from "react";
import { UserContext } from "@/contexts/user-context";

const Sidebar = forwardRef(({ collapsed }, ref) => {
    const { user } = useContext(UserContext);  // Exemple avec contexte
    const role = user?.role;
    const navbarLinks = role === "enseignant" ? navbarLinksProf : navbarLinksEtudiant;

    return (
        <aside
            ref={ref}
            className={cn(
                "fixed z-[100] flex h-full w-[240px] flex-col overflow-x-hidden border-r border-slate-300 bg-white [transition:_width_300ms_cubic-bezier(0.4,_0,_0.2,_1),_left_300ms_cubic-bezier(0.4,_0,_0.2,_1),_background-color_150ms_cubic-bezier(0.4,_0,_0.2,_1),_border_150ms_cubic-bezier(0.4,_0,_0.2,_1)] dark:border-slate-700 dark:bg-slate-900",
                collapsed ? "md:w-[70px] md:items-center" : "md:w-[240px]",
                collapsed ? "max-md:-left-full" : "max-md:left-0",
            )}
        >
            <div className="flex gap-x-3 p-3">
                <img src={logoLight} alt="Logo" className="dark:hidden" />
                <img src={logoDark} alt="Logo" className="hidden dark:block" />
                {!collapsed && <p className="text-lg font-medium">{role === "enseignant" ? "Enseignant" : "Étudiant"}</p>}
            </div>

            <div className="flex w-full flex-col gap-y-4 p-3">
                {navbarLinks.map((navbarLink) => (
                    <nav key={navbarLink.title} className={cn("sidebar-group", collapsed && "md:items-center")}>
                        <p className={cn("sidebar-group-title", collapsed && "md:w-[45px]")}>{navbarLink.title}</p>
                        {navbarLink.links.map((link) => (
                            <NavLink
                                key={link.label}
                                to={link.path}
                                className={cn("sidebar-item", collapsed && "md:w-[45px]")}
                            >
                                <link.icon size={22} />
                                {!collapsed && <p>{link.label}</p>}
                            </NavLink>
                        ))}
                    </nav>
                ))}
            </div>
        </aside>
    );
});

export { Sidebar };
Sidebar.displayName = "Sidebar";

Sidebar.propTypes = {
    collapsed: PropTypes.bool,
};


