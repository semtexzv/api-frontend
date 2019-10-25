import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { NotificationsPortal } from '@redhat-cloud-services/frontend-components-notifications';
import { Routes } from './Routes';
import './App.scss';

class App extends Component {

    componentDidMount () {
        insights.chrome.init();
        insights.chrome.identifyApp('api');
    }

    componentWillUnmount () {
        this.appNav();
        this.buildNav();
    }

    render () {
        return (
            <React.Fragment>
                <NotificationsPortal />
                <Routes childProps={ this.props } />
            </React.Fragment>
        );
    }
}

App.propTypes = {
    history: PropTypes.object
};

/**
 * withRouter: https://reacttraining.com/react-router/web/api/withRouter
 * connect: https://github.com/reactjs/react-redux/blob/master/docs/api.md
 *          https://reactjs.org/docs/higher-order-components.html
 */
export default withRouter (connect()(App));
