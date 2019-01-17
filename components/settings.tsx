import * as React from 'react'
import {
  Typography, Button, LinearProgress, Divider, Input, InputLabel, FormGroup, FormControlLabel,
  FormControl, FormHelperText, Switch, Select, MenuItem
} from '@material-ui/core'
import { Mutation } from 'react-apollo'
import { gql } from 'apollo-boost'

/* eslint-disable quotes, no-multi-str, no-undef */
interface Props {
  data: {
    addRoleForAll: string, joinAutorole: string, ocrOnSend: boolean, joinLeaveMessages: {
      channelName: string,
      joinMessage: string,
      leaveMessage: string
    }
  },
  token: string,
  server: { perms: boolean, icon: string, serverId: string, name: string, channels: string[] },
  refetch: Function
}
interface State {
  role: string,
  joinAutorole: string,
  ocrOnSend: boolean,
  joinLeaveMessages: {
    channelName: string,
    joinMessage: string,
    leaveMessage: string
  }
}
export default class Settings extends React.Component<Props, State> {
  constructor (props) {
    super(props); this.state = {
      role: this.props.data.addRoleForAll,
      joinAutorole: this.props.data.joinAutorole,
      ocrOnSend: this.props.data.ocrOnSend,
      joinLeaveMessages: {
        channelName: this.props.data.joinLeaveMessages.channelName,
        joinMessage: this.props.data.joinLeaveMessages.joinMessage,
        leaveMessage: this.props.data.joinLeaveMessages.leaveMessage
      }
    }
  }

  render () {
    const mutation = gql`
mutation variables(
  $server: String!, $token: String!, $role: String, $joinAutorole: String,
  $joinLeaveMessages: JoinLeaveMessagesInput, $ocrOnSend: Boolean
) {
  editServerSettings(input: {
    serverId: $server, linkToken: $token, addRoleForAll: $role, joinAutorole: $joinAutorole,
    joinLeaveMessages: $joinLeaveMessages, ocrOnSend: $ocrOnSend
  }) {
    addRoleForAll
    joinAutorole
    ocrOnSend
    joinLeaveMessages {
      channelName
      joinMessage
      leaveMessage
    }
  }
}
    `
    return (
      <Mutation mutation={mutation} variables={{
        token: this.props.token,
        role: this.state.role,
        server: this.props.server.serverId,
        joinAutorole: this.state.joinAutorole,
        joinLeaveMessages: this.state.joinLeaveMessages,
        ocrOnSend: this.state.ocrOnSend
      }}>
        {(updateSettings, { loading, error }) => (
          <>
            <br />
            <Typography variant='h6' gutterBottom>Public Roles</Typography>
            <Divider />
            <br />
            <Typography gutterBottom>
              {'Public roles enable members to add the roles listed to themselves without any \
              necessary permissions. This enables features such as colored roles or announcement \
              pings.'}
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Role Names</InputLabel>
              <Input
                value={this.state.role} fullWidth
                onChange={e => this.setState({ role: e.target.value })} margin='dense' />
              <FormHelperText>Leave blank to disable public roles</FormHelperText>
            </FormControl>
            <br /><br />
            <Typography variant='h6' gutterBottom>Join/Leave Actions</Typography>
            <Divider />
            <br />
            <Typography variant='subtitle1' gutterBottom>Join Autorole</Typography>
            <Typography gutterBottom>
              {'Join autorole automatically gives a joining person a specified role. \
              It is useful in giving members specified colors or in combination with public \
              roles by giving a person a high role.'}
            </Typography>
            <Typography gutterBottom>
              {'Use | to separate roles. If a role contains |, it will not be added. \
              Prefix role names with bot- for adding roles to bots automatically.'}
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Role Names</InputLabel>
              <Input
                value={this.state.joinAutorole} fullWidth
                onChange={e => this.setState({ joinAutorole: e.target.value })} margin='dense' />
              <FormHelperText>Leave blank to disable autorole</FormHelperText>
            </FormControl>
            <br /><br /><Divider /><br />
            <Typography variant='subtitle1' gutterBottom>Join/Leave Messages</Typography>
            <Typography gutterBottom>
              {'Join/leave messages send a customized message whenever someone joins or leaves \
              \\o/'}
            </Typography>
            <Typography gutterBottom>Ensure the channel name is correct.</Typography>
            <FormControl fullWidth>
              <InputLabel>Channel Name</InputLabel>
              <Select value={this.state.joinLeaveMessages.channelName} fullWidth margin='dense'
                onChange={e => this.setState({
                  joinLeaveMessages: {
                    ...this.state.joinLeaveMessages, channelName: e.target.value
                  }
                })}
              >
                <MenuItem value=''><em>None</em></MenuItem>
                {this.props.server.channels.map(i => (<MenuItem value={i} key={i}>{i}</MenuItem>))}
              </Select>
              <FormHelperText>Leave blank to disable join/leave messages</FormHelperText>
            </FormControl>
            <div style={{ height: 10 }} />
            <Typography gutterBottom>
              {'Use {un} for the username of the \
              joining/leaving user, {m} for mentioning them and {d} for their discriminator.'}
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Join Message</InputLabel>
              <Input
                value={this.state.joinLeaveMessages.joinMessage} fullWidth
                onChange={e => this.setState({ joinLeaveMessages: {
                  ...this.state.joinLeaveMessages, joinMessage: e.target.value
                } })} margin='dense' />
            </FormControl>
            <div style={{ height: 10 }} />
            <FormControl fullWidth>
              <InputLabel>Leave Message</InputLabel>
              <Input
                value={this.state.joinLeaveMessages.leaveMessage} fullWidth
                onChange={e => this.setState({ joinLeaveMessages: {
                  ...this.state.joinLeaveMessages, leaveMessage: e.target.value
                } })} margin='dense' />
            </FormControl>
            <br /><br />
            <Typography variant='h6' gutterBottom>Text Recognition on Image Send</Typography>
            <Divider />
            <FormGroup row>
              <FormControlLabel
                control={
                  <Switch color='secondary' checked={this.state.ocrOnSend}
                    onChange={() => this.setState({ ocrOnSend: !this.state.ocrOnSend })}
                  />
                }
                label='Enable OCR on Send'
              />
            </FormGroup>
            <Typography gutterBottom>
              {'This option recognizes text from any image whenever an image is sent in any \
              channel and posts the result using /ocr.'}
            </Typography>
            <div style={{ height: 10 }} />
            <Button size='small'>Cancel</Button>
            <Button size='small' onClick={async () => {
              await updateSettings()
              this.props.refetch()
            }}>Save</Button>
            {loading && <><br /><LinearProgress color='secondary' variant='query' /></>}
            {error && <><br /><Typography color='error'>Error :( Please try again</Typography></>}
          </>
        )}
      </Mutation>
    )
  }
}
/* eslint-enable quotes, no-multi-str, no-undef */
