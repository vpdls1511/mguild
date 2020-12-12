import React, {Component} from "react";
import {Route} from "react-router-dom";
import { Home, About } from '../pages';

import "../style/index.scss";

import Menu from '../componenets/Menu';

class App extends Component {
    render(){
        return(
            <div>
                <Menu />
                <Route exact path="/" component={Home} />
                <Route path="/about" component={About} />
            </div>
        )
    }
}

export default App;
