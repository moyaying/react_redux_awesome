import React, {Component} from 'react'
import configureStore from "./store/configure_store";
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom'
import {Provider} from "react-redux";
import Typography from "@material-ui/core/Typography";
import withMuiTheme from './with_mui_theme';
import main from './containers/main';

const store = configureStore();

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <Router basename="/">
          <Switch>
            <Route exact={true} path="/" component={main}/>
            <Route component={NoMatch}/>
          </Switch>
        </Router>
      </Provider>
    )
  }
}

function NoMatch({location}) {
  return (
    <div>
      <Typography variant={"h6"}>
        Sorry, the page does not exist!
      </Typography>
    </div>
  );
}


export default withMuiTheme(App)