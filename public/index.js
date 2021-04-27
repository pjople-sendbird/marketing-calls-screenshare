

function login() {
    connect((success) => {
        if (success) {
            loginContainer.style.display = 'none';
            mainMenuContainer.style.display = 'table';        
        }
    })
}

function connect() {
    // Init Sendbird Calls with your application Id
    SendBirdCall.init( appId.value );
    // Ask for video and audio permission
    askBrowserPermission();
    // Authorize user
    authorizeUser();
    // Connect to SB chat
    connectToSBChat();
}

function unload() {
    endCall();
}

/**
 * When this is called, Browser will ask for Audio and Video permission
 */
 function askBrowserPermission() {
    SendBirdCall.useMedia({ audio: true, video: true });
}

/**
 * To be able to make and receive calls, a user must be authorized
 */
 function authorizeUser() {
    const authOption = { 
        userId: userId.value,
        accessToken: null
    };
    SendBirdCall.authenticate(authOption, (res, error) => {
        if (error) {
            console.dir(error);
            alert(`Error authenticating user! Is your Access 
            / Session token correct? This user exists?`);
        } else {
            connectToWebsocket();
        }
    });    
}

/**
 * To be able to make and receive calls, 
 * a user must be connected to Sendbird
 * websockets.
 */
function connectToWebsocket() {
    SendBirdCall.connectWebSocket()
    .then(() => {
        waitForCalls();
        loginContainer.style.display = 'none';
        mainMenuContainer.style.display = 'table';
    })
    .catch((err) => {
        console.dir(err);
        alert('Failed to connect to Socket server');
    });
}

/**
 * Once connected to websockets,
 * let's wait for calls
 */
 function waitForCalls() {
    SendBirdCall.addListener('ANY UNIQUE_HANDLER_ID HERE', {
        onRinging: (call) => {
            console.log('Ringing...');
            /**
             * A call arrived
             */
            call.onEstablished = (call) => {
                currentCall = call;
                console.log('Call established');
                butMakeCall.style.display = 'none';
                butEndCal.style.display = 'inline-block';
                butMuteCall.style.display = 'inline-block';
                if (isCustomer) {
                    butShareScreen.style.display = 'inline-block';
                } else {
                    butCloseSmallVideo.style.display = 'inline-block';
                }
            };
    
            call.onConnected = (call) => {
                currentCall = call;
                console.log('Call connected');
            };
    
            call.onEnded = (call) => {
                currentCall = null;
                console.log('Call ended');
                butMakeCall.style.display = 'inline-block';
                butEndCal.style.display = 'none';
                butMuteCall.style.display = 'none';
                if (isCustomer) {
                    butShareScreen.style.display = 'none';
                } else {
                    hideSmallWindow(false);
                }
            };
            /**
             * Let's accept this call
             */    
            const acceptParams = {
                callOption: {
                    localMediaView: (isCustomer ? big_video_element_id : small_video_element_id),
                    remoteMediaView: (isCustomer ? small_video_element_id : big_video_element_id),
                    audioEnabled: true,
                    videoEnabled: true
                }
            };    
            call.accept(acceptParams);
        }
    });    
}

/**
 * Make a call to other user
 */
function makeCall() {
    /**
     * Ask user_id to call to
     */
    const userId = isCustomer ? 'agent' : 'customer';
    /**
     * Set dialing parameters
     */
    const dialParams = {
        userId,
        isVideoCall: true,
        callOption: {
            localMediaView: (isCustomer ? big_video_element_id : small_video_element_id),
            remoteMediaView: (isCustomer ? small_video_element_id : big_video_element_id),
            videoEnabled: true,
            audioEnabled: true
        }
    };
    /**
     * Make the call
     */
    const call = SendBirdCall.dial(dialParams, (call, error) => {
        if (error) {
            console.dir(error);
            alert('Dial Failed!');
        } else {
            console.log('Dial Success');
        }    
    });    
    /**
     * Once the call is established,
     * run this logic
     */
    call.onEstablished = (call) => {
        console.log('onEstablished');
        currentCall = call;  
        butEndCal.style.display = 'inline-block';
        butMuteCall.style.display = 'inline-block';
        butMakeCall.style.display = 'none';
        if (isCustomer) {
            butShareScreen.style.display = 'inline-block';
        } else {
            butCloseSmallVideo.style.display = 'inline-block';
        }
    };
    /**
     * Once the call is connected,
     * run this logic
     */
    call.onConnected = (call) => {
        console.log('onConnected');
    };
    /**
     * Once the call ended,
     * run this logic
     */
    call.onEnded = (call) => {
        console.log('onEnded');
        currentCall = null;
        butEndCal.style.display = 'none';
        butMuteCall.style.display = 'none';
        butMakeCall.style.display = 'inline-block';
        if (isCustomer) {
            butShareScreen.style.display = 'none';
        } else {
            hideSmallWindow(false);
        }
    };    
    /**
     * Remote user changed audio settings
     * (analysys not covered in this tutorial)
     */
    call.onRemoteAudioSettingsChanged = (call) => {
        console.log('Remote user changed audio settings');
    };    
    /**
     * Remote user changed audio settings
     * (analysys not covered in this tutorial)
     */
     call.onRemoteVideoSettingsChanged = (call) => {
        console.log('Remote user changed video settings');
    };
}

function endCall() {
    if (!currentCall) { return }
    currentCall.end();
}

/**
 * Once the call is established,
 * let's share the screen
 */
async function shareScreen() {
    // We need a valid active call 
    if (!currentCall) {
        alert('No current call in progress');
        return;
    }
    try {
        // This will do the whole job
        await currentCall.startScreenShare();
        // Let's add a listener
        currentCall.onScreenSharingStopped = () => {
            console.log('Screen shared stopped by remote user');
            if (isCustomer) {
                butShareScreen.style.display = 'inline-block';
                butStopShareScreen.style.display = 'none';
            }        
        }
        if (isCustomer) {
            butShareScreen.style.display = 'none';
            butStopShareScreen.style.display = 'inline-block';
        }    
    } catch (error) {
        console.dir(error)
        alert('Screen share failed');
    }    
}

/**
 * Stop screen share
 */
async function stopScreenShare() {
    // We need a valid active call 
    if (!currentCall) {
        alert('No current call in progress');
        return;
    }    
    try {
        await currentCall.stopScreenShare();
        if (isCustomer) {
            butShareScreen.style.display = 'inline-block';
            butStopShareScreen.style.display = 'none';
        }    
    } catch (error) {
        console.dir(error)
        alert('Unable to stop Screen sharing');
    }    
}

function mute() {
    if (isCustomer) {
        big_video_element_id.muted = true;
    } else {
        small_video_element_id.muted = true
    }
    butMuteCall.style.display = 'none';
    butUnmuteCall.style.display = 'inline-block';
}

function unmute() {
    if (isCustomer) {
        big_video_element_id.muted = true;
    } else {
        small_video_element_id.muted = true
    }
    butMuteCall.style.display = 'inline-block';
    butUnmuteCall.style.display = 'none';
}





/**
 * CHAT
 */
function connectToSBChat() {
    sb = new SendBird({
        appId: appId.value
    });
    sb.connect(userId.value, (user, error) => {
        if (error) {
            console.dir(error);
            alert('Unable to connect to Sendbird Chat');
        } else {
            startListeningMessages();
            createGroupChannelAndChatWithCustomer();
        }
    });
}
function startListeningMessages() {
    var channelHandler = new sb.ChannelHandler();
    channelHandler.onMessageReceived = (channel, message) => {
        if (!GROUP_CHANNEL) {
            GROUP_CHANNEL = channel;
        }
        console.dir(message);
        addMessageToList(message);
    };
    sb.addChannelHandler('CHANNEL-' + new Date().getTime(), channelHandler);    
}
function createGroupChannelAndChatWithCustomer() {
    if (isCustomer) {
        var userIds = ['customer', 'agent'];
        sb.GroupChannel.createChannelWithUserIds(userIds, 
                true, 'ShareScreenDemo', 'COVER_IMAGE_OR_URL', 'DATA', (groupChannel, error) => {
            if (error) {
                console.dir(error);
                alert('Error inviting customer to chat. Please check this browser console');
            } else {
                GROUP_CHANNEL = groupChannel;
                addMessageToList('Welcome! Please enter your question', true);    
            }
        });
    }
}
function addMessageToList(message, isAdmin = false) {
    const sender = message._sender ? message._sender.userId : 'Admin';
    var out;
    if (isAdmin) {
        out = `
            <div class="card mb-2" style="border-radius:10px;">
                <div class="card-body p-3 small text-left">
                    ${ message }
                    <div class="mt-2 small text-muted">
                        Sent by: ${ sender }
                    </div>
                </div>
            </div>
        `;
    } else {
        out = `
            <div class="card mb-2" style="border-radius:10px;">
                <div class="card-body p-3 small text-left">
                    ${ message.message }
                    <div class="mt-2 small text-muted">
                        Sent by: ${ sender } - ${ new Date(message.createdAt).toLocaleTimeString() }
                    </div>
                </div>
            </div>
        `;
    }
    messageList.innerHTML += out;
}
function sendMessage() {
    if (!GROUP_CHANNEL) {
        return;
    }
    var message = chatMessage.value;
    if (!message) {
        return;
    }
    const params = new sb.UserMessageParams();
    params.message = message;    
    GROUP_CHANNEL.sendUserMessage(params, (userMessage, error) => {
        if (error) {
            console.dir(error);
            alert('Error sending chat. Please check this browser console');
        } else {
            console.dir(userMessage);
            addMessageToList(userMessage);
        }    
    });
}





function hideSmallWindow(hide = true) {
    videoSmall.style.display = (hide ? 'none' : 'inline-block');
    butCloseSmallVideo.style.display = (hide ? 'none' : 'inline-block');
}

/**
 * SendBird main object
 */
 var sb;

 /**
  * Group channel where Agent 
  * and Customer are chatting
  */
 var GROUP_CHANNEL;

/**
 * Store the current active call 
 * as a global variable.
 */
var currentCall;

var loginContainer = document.getElementById('loginContainer');
var mainMenuContainer = document.getElementById('mainMenuContainer');
var appId = document.getElementById('appId');
var userId = document.getElementById('userId');
var chatMessage = document.getElementById('chatMessage');
var big_video_element_id = document.getElementById('big_video_element_id');
var small_video_element_id = document.getElementById('small_video_element_id');
var messageList = document.getElementById('messageList');

var butMakeCall = document.getElementById('butMakeCall');
var butShareScreen = document.getElementById('butShareScreen');
var butMuteCall = document.getElementById('butMuteCall');
var butUnmuteCall = document.getElementById('butUnmuteCall');
var butStopShareScreen = document.getElementById('butStopShareScreen');
var butEndCal = document.getElementById('butEndCall');
var butCloseSmallVideo = document.getElementById('butCloseSmallVideo');

