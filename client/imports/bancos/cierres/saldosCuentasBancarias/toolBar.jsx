

import React from "react";
import PropTypes from 'prop-types';

import { Navbar, Nav, NavItem } from 'react-bootstrap';

export default function NavBar({ leerPaginaDesdeServer }) {

    function handleSelect(selectedKey) {
        switch (selectedKey) { 
            case 1: 
                leerPaginaDesdeServer("mas"); 
                break; 
            case 2: 
                leerPaginaDesdeServer("todo"); 
                break; 
        }
    }

    return (
        <Navbar collapseOnSelect fluid className="toolBar_navBar">
            <Navbar.Collapse>
                <Nav pullRight onSelect={handleSelect}>
                    <NavItem eventKey={1} className="navBar_button">
                        Más
                    </NavItem>
                    <NavItem eventKey={2} className="navBar_button">
                        Todo
                    </NavItem>
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
} 

NavBar.propTypes = {
    leerPaginaDesdeServer: PropTypes.func.isRequired,
}