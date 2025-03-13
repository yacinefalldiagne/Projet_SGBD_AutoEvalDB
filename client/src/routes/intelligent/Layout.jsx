import { Outlet } from "react-router-dom";

function IntelligentLayout() {
    return (
        <div>
            <h1 className="title">Espace Intelligent</h1>
            <Outlet />
        </div>
    );
}

export default IntelligentLayout;
