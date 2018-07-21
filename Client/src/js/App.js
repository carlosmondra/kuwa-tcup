import React, { Component } from 'react';
import Navigation from './Navigation';
// import SetPassword from './SetPassword';

import Steps from './Steps';
import ProvideCredentials from './ProvideCredentials';
import RecordRegistrationVideo from './RecordRegistrationVideo';
import YourKuwaId from './YourKuwaId';

// import { Loading } from './Load';
// import { Success } from './Success';
import { Error } from './Error';
// import RequestSponsorship from './RequestSponsorship';
// import UploadToStorage from './UploadToStorage';
// import QRCodeGen from './QRCodeGen';
import '../css/App.css';

import { connect } from 'react-redux';
import { Provider } from 'react-redux';
import { store } from './store';
import { history } from './store';

import { Route, Switch } from 'react-router';
import { ConnectedRouter } from 'connected-react-router';

/**
 * Loads different components depending on the state of the program
 * @class CreateKuwaId
 * @extends Component
 */
class App extends Component {
  render() {
    let errorMessage = this.props.helpText.error;
    let successMessage = this.props.helpText.success;
    return (
      <div>
        <Provider store={store}>
          <ConnectedRouter history={history}>
            <div>
              <Navigation />
              <Switch>
                <Route exact path='/' component={Steps}/>
                <Route exact path='/ProvideCredentials' component={ProvideCredentials}/>
                <Route exact path='/RecordRegistrationVideo' component={RecordRegistrationVideo}/>
                <Route exact path='/YourKuwaId' component={YourKuwaId}/>
                <Route exact path='/Error' render={(props) => <Error errorMessage="asdfasdf" />}/>
                {/* <Route exact path='/Success' render={(props) => <Success successMessage="asdfasdf" />}/> */}
                {/* <Route exact path='/' render={(props) => <Loading loadingMessage="Loading message" />}/> */}
              </Switch>
            </div>
          </ConnectedRouter>
        </Provider>
      </div>
    )
  }
}

const renderScreen = (props) => {
  switch(props.screen.screenName) {
    case 'SET_PASSWORD':
      return(
          <SetPassword />
      )
    case 'LOADING':
      return (
        <Loading loadingMessage={props.screen.helpText} />
      )
    case 'SUCCESS':
      return (
        <Success successMessage={props.screen.helpText} />
      )
    case 'ERROR':
      return (
        <Error errorMessage={props.screen.helpText} />
      )
    case 'REQUEST_SPONSORSHIP':
      return (
          <RequestSponsorship />
      )
    case 'UPLOAD_TO_STORAGE':
      return (
          <UploadToStorage />
      )
    default:
      return (
        <Error errorMessage="ERROR LOADING SCREEN" />
      )
  }
}

const mapStateToProps = state => {
  return {
    screen: state.kuwaReducer.screen,
    pathname: state.router.location.pathname,
    search: state.router.location.search,
    hash: state.router.location.hash,
    helpText: {
      success: state.kuwaReducer.screen.success.helpText,
      error: state.kuwaReducer.screen.error.helpText
    }
  }
}

export default connect(mapStateToProps)(App);