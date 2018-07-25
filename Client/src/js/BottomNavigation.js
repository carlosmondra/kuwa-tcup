import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';

import { withStyles } from '@material-ui/core/styles';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';
import FavoriteIcon from '@material-ui/icons/Favorite';
import PermIcon from '@material-ui/icons/PermIdentity';

import grey from '@material-ui/core/colors/grey';

const styles = {
    root: {
        color: 'white',
        '&$selected': {
            color: '#11B73F'
        },
    },
    selected: {}
}

class SimpleBottomNavigation extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: 0
        }
    }
    render() {
        if (!this.props.infoUploaded) return null;
        const { classes } = this.props;
        return (
            <div>
                <div style={{ padding: "2em" }}></div>
                <BottomNavigation
                    value={this.state.value}
                    onChange={(event, value) => {
                            this.setState({ value });
                        }}
                    showLabels
                    style={{ position: "fixed", bottom:"0", width: "100%", backgroundColor: grey[800] }}
                >
                    <BottomNavigationAction onClick={() => {
                        if(this.state.value !== 0) this.props.navigateTo('/YourKuwaId')
                    }} classes={{ root: classes.root, selected: classes.selected }} label="Your Kuwa ID" icon={<PermIcon />} />
                    <BottomNavigationAction onClick={() => {
                        if(this.state.value !== 1) this.props.navigateTo('/YourStatus')
                    }} classes={{ root: classes.root, selected: classes.selected }} label="Kuwa ID Status" icon={<FavoriteIcon />} />
                </BottomNavigation>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        infoUploaded: state.kuwaReducer.kuwaId.infoUploaded
    }
}

const mapDispatchToProps = dispatch => {
    return {
        navigateTo: link => {
            dispatch(push(link))
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(SimpleBottomNavigation));