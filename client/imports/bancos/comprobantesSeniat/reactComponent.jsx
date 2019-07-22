

import React from "react";
import PropTypes from 'prop-types';

import { ThemeProvider } from '@material-ui/styles';
import { StylesProvider } from '@material-ui/styles';

// nótese cómo centralizamos el customization del theme en 'muiTheme.js' y lo pasamos con ThemeProvider a todos los 
// children react components. Lo ideal sería que ésto estuviera en el root de la aplicación, solo que esta aplicación 
// comenzo con angular.js y no con react. El root es un elemento angular y no react ... 

// sin embargo, la idea es que podemos pasar este theme cada vez que agreguemos una página, como esta, que estará 
// full de componentes react y react material ui ... 

import theme from '/client/imports/genericReactComponents/muiTheme'; 

import MainPage from "./mainPage"; 

export default class NumerosComprobanteSeniat extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {

        const style = { border: '1px solid lightgray', margin: '8px', };

        return (
            <div style={style}>
                <StylesProvider injectFirst>
                    <ThemeProvider theme={theme}>
                        <MainPage ciaContabSeleccionada={this.props.ciaContabSeleccionada} />
                    </ThemeProvider>
                </StylesProvider>
            </div>
        );
    }
}

NumerosComprobanteSeniat.propTypes = {
    ciaContabSeleccionada: PropTypes.number.isRequired, 
}