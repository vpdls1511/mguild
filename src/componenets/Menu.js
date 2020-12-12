import React from 'react';
import { NavLink } from 'react-router-dom';

const Menu = () => {
    return (
        <div className="menu">
            <ul className="topMenu">
                <li><NavLink exact to="/"  >길드원</NavLink></li>
                <li><NavLink exact to="/about" >레벨통계</NavLink></li>
            </ul>
        </div>
    );
}

export default Menu;
