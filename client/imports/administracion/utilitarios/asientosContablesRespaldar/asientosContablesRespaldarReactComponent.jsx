

import React from "react";
import MainPage from "./mainPage"; 

export default class AsientosContablesRespaldarReactComponent extends React.Component {

  render() {

    const style = { border: '1px solid lightgray', margin: '8px', }; 

    return (
      <div style={style}>
        <MainPage />
      </div>
    );
  }
}