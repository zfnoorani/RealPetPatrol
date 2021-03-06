import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  TextInput,
  ImageBackground,
} from 'react-native';
import { auth, fire, database } from "../../fbconfig";
const screenWidth = Math.round(Dimensions.get('window').width);
const screenHeight = Math.round(Dimensions.get('window').height);

export default class Chat extends Component {
  constructor(props) {
    super(props);
    /* State Data:
    f_id, f_name, f_email belong to the person the user is chatting to
    u_id, u_name, u_email belong to the current user
    text holds the input text
    chatData holds all messages between these users
    */
    this.state = {
      f_id:'',
      f_name:'',
      f_email:'',
      u_id:'',
      u_name:'',
      u_email:'',
      text:'',
      chatData:[],
    }
  }

  // Setup for component before rendering
  componentWillMount=()=>{
      this.refOn()
      this.retrieveData()
  }

  // Remove listeners when component is unmounted
  componentWillUnmount=()=>{
    this.refOff()
  }

  // Retrieve chat data and set a listener for updates in realtime DB
  refOn = () => {
    console.log('Retrieving chat data...')
    let cData=[]
    let component = this
    // Listener for messages
    database.ref('Messages').on('child_added', function (snapshot) {
      console.log("Child added")
      const { timestamp: numberStamp, text, user,name,femail,fid } = snapshot.val();
      const { key: id } = snapshot;
      const { key: _id } = snapshot; 
      const timestamp = new Date(numberStamp);
      const message = {
        femail,
        fid,
        text,
        timestamp,
        user
      };
    cData.push(message)
    console.log('Chat data ==')
    console.log(cData)
    // Update the chat data used to update the UI
    component.setState({chatData:cData})
    })
  }

  // Remove listeners for Messages collection in realtime DB
  refOff() {
    console.log("Unmounting chat component...")
    database.ref('Messages').off();
  }

  // Get current user and target user data for messaging
  retrieveData = async() => {
      let fid = this.props.route.params.fid
      let fname = this.props.route.params.fname
      let femail = this.props.route.params.femail
      let uid = this.props.route.params.uid
      let uname = this.props.route.params.username
      let uemail = this.props.route.params.uemail
      console.log('this is user/sender data==>  '+uid+'   '+uname+'   '+'   '+uemail)
      console.log('this is the target/receiver data ==>  '+fid+'   '+fname+'   '+femail)
      this.setState({
        f_email:femail,
        f_id:fid,
        f_name:fname,
        u_id:uid,
        u_name:uname,
        u_email:uemail
      }) 
      console.log('Current state:')
      console.log(this.state);
  }

  // Sends a message to the realtime database
  sendMessage=()=>{
    console.log('Sending message:')
    //console.log(fid + ' ' + femail + ' ' + text + ' ' + uid + ' ' + uemail + ' ' + uname)
    console.log(this.state)
    // Push to 'Messages' database
    database.ref('Messages/').push({
      // Receiver
      'fid':this.state.f_id,
      'femail':this.state.f_email,
      'text':this.state.text,
      // Sender
      user:{
          'uid':this.state.u_id,
          'uemail':this.state.u_email,
          'username':this.state.u_name
      }
  }).then((data)=>{
      console.log('data ' , data)
  }).catch((error)=>{
      console.log('error ' , error)
  })
  }

  // Triggered when user clicks send button
  onSend=()=>{
      // Clear input and send message to DB
        this.textInput.clear()
        this.sendMessage()
        console.log(
          'fid  '+this.state.f_id+
          '  femail  '+this.state.f_email+
          '  text '+this.state.text+
          '  uid  '+this.state.u_id+
          '  uemail  '+this.state.u_email+
          '  ename  '+this.state.u_name
        )
    }

  renderDate = (date) => {
    return(
      <Text style={styles.time}>
        {date}
      </Text>
    );
  }

  // Render the chat screen to DM a user
  render() {
    // Get chat messages
    let Data=this.state.chatData 
    console.log('Rendering Chat Data...')
    console.log(Data)
    console.log('current state')
    console.log(this.state)
    // For each chat message...
    let chats=Data.map((c_data)=>{
          // Check if message is SENT or RECEIVED
          if(this.state.f_id==c_data.fid && this.state.u_id==c_data.user.uid || this.state.f_id==c_data.user.uid && this.state.u_id==c_data.fid){
              // Sent Message
              if(this.state.u_id==c_data.user.uid){
                  return(
                    <View style={styles.itemOut}>  
                    <Text style={{fontSize:16,color:"#000" }}> {c_data.text}</Text>
                    </View>
                  )
               // Received Message
              }else{
                  return(
                    <View style={styles.itemIn}>             
                          <Text style={{fontSize:16,color:"#000" }}> {c_data.text}</Text>
                    </View>
                  )
              }
          }
      }) 

    return (
        <View style={styles.container}>
          <ImageBackground
            style={styles.background}
            source={require("../assets/pawprints.jpg")}>
              <View style={styles.top_header}>
                <Image style={styles.header_icon} source={require('../assets/paw.png')}></Image>
                <Text style={styles.header_text}>Chatting with: {this.state.f_name}</Text>
                <Image style={styles.header_icon} source={require('../assets/paw.png')}></Image>
              </View>
              <View style={{
                  height:screenHeight - 150,
                  marginVertical: 20,
                  flex: 1,
                  flexDirection: 'row',
                  backgroundColor: "#363636",
                  borderRadius:10,
                  padding:10,
                }}>
                <ScrollView
                  ref = {ref => {this.scrollView = ref}}
                  // Scroll to bottom when a new message is received
                  onContentSizeChange={() => this.scrollView.scrollToEnd({animated: true})}>       
                    {chats} 
                </ScrollView>
              </View>
              <View style={styles.footer}>
                  <View style={styles.inputContainer}>
                    <TextInput style={styles.inputs}
                        placeholder="Write a message..."
                        underlineColorAndroid='transparent'
                        ref={input => { this.textInput = input }}
                        onChangeText={(msg) => this.setState({text:msg})}/>
                  </View>
                  <TouchableOpacity style={styles.btnSend} onPress={this.onSend}>
                      <Image source={{uri:"https://png.icons8.com/small/75/ffffff/filled-sent.png"}} style={styles.iconSend}  />
                  </TouchableOpacity>
              </View>
            </ImageBackground>
        </View>
      )
    }
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "contain",
  },
  container:{
    flex:1
  },
  list:{
    paddingHorizontal: 17,
  },
  footer:{
    flexDirection: 'row',
    height:60,
    backgroundColor: '#757575',
    paddingHorizontal:10,
    padding:5,
  },
  top_header: {
    backgroundColor: "#5c5c5c",
    padding:10,
    textAlign: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  header_icon: {
    width:30,
    height:30,
    marginRight: 5,
    marginLeft: 5,
  },
  header_text: {
    color: '#16aef5',
    fontWeight: 'bold',
    fontSize: 20,
  },
  btnSend:{
    backgroundColor:"#00BFFF",
    width:40,
    height:40,
    borderRadius:360,
    alignItems:'center',
    justifyContent:'center',
  },
  iconSend:{
    width:30,
    height:30,
    alignSelf:'center',
  },
  inputContainer: {
    borderBottomColor: '#F5FCFF',
    backgroundColor: '#363636',
    borderRadius:30,
    borderBottomWidth: 1,
    height:40,
    flexDirection: 'row',
    alignItems:'center',
    flex:1,
    marginRight:10,
    color: '#bec1c2'
  },
  inputs:{
    height:40,
    marginLeft:16,
    borderBottomColor: '#FFFFFF',
    flex:1,
    color: '#bec1c2'
  },
  balloon: {
    maxWidth: 500,
    padding: 15,
    borderRadius: 20,
  },
  itemIn: {
    alignSelf: 'flex-start',
    backgroundColor:"#dedede",
    //padding:15,
    borderRadius:4,
    marginBottom:20, 
    width:'50%',
    maxWidth: 500,
    padding: 15,
    borderRadius: 20
  },
  itemOut: {
    alignSelf: 'flex-end',
    backgroundColor:"#91d0fb",
    //padding:15,
    marginLeft:'50%',
    borderRadius:4,
    marginBottom:20, 
    width:'50%',
    maxWidth: 500,
    padding: 15,
    borderRadius: 20,
  },
  time: {
    alignSelf: 'flex-end',
    margin: 15,
    fontSize:12,
    color:"#808080",
  },
  item: {
    marginVertical: 14,
    flex: 1,
    flexDirection: 'row',
    backgroundColor:"#eeeeee",
    borderRadius:50,
    padding:5,
  },
})