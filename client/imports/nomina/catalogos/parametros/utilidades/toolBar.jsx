

import React from "react";
import PropTypes from 'prop-types';

import { Navbar, Nav, NavItem } from 'react-bootstrap';

export default function NavBar({ handleClickToolbarButton }) {

    function handleSelect(selectedKey) {
        switch (selectedKey) {
            case 1:
                handleClickToolbarButton("grabar");
                break;
            case 2:
                handleClickToolbarButton("nuevo");
                break;
            case 3:
                handleClickToolbarButton("registroNomina");
                break;
            case 4:
                handleClickToolbarButton("mas");
                break;
            case 5:
                handleClickToolbarButton("todo");
                break;
        }
    }

    return (
        <Navbar collapseOnSelect fluid className="toolBar_navBar">
            <Navbar.Collapse>
                <Nav onSelect={handleSelect}>
                    <NavItem eventKey={1} className="navBar_button">
                        Grabar
                    </NavItem>
                    <NavItem eventKey={2} className="navBar_button">
                        Nuevo
                    </NavItem>
                    <NavItem className="navBar_button">|</NavItem>
                    <NavItem eventKey={3} className="navBar_button">
                        Agregar registro de nómina
                    </NavItem>
                </Nav>

                <Nav pullRight onSelect={handleSelect}>
                    <NavItem eventKey={4} className="navBar_button">
                        Más
                    </NavItem>
                    <NavItem eventKey={5} className="navBar_button">
                        Todo
                    </NavItem>
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
} 

NavBar.propTypes = {
    handleClickToolbarButton: PropTypes.func.isRequired,
}