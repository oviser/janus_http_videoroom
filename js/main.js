'use strict';


// Create WebSocket connection.
const socket = new WebSocket('ws://localhost:8080');

// Connection opened
socket.addEventListener('open', function (event) {
  console.log('ws open')
});

// Listen for messages
socket.addEventListener('message', function (event) {
    const data = JSON.parse(event.data)
    console.log(data)
    pc1.setRemoteDescription({
      type: "answer",
      sdp: data.answer
    })
})


const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
callButton.disabled = true;
hangupButton.disabled = true;
startButton.addEventListener('click', start);
callButton.addEventListener('click', call);
hangupButton.addEventListener('click', hangup);

let startTime;
const localVideo = document.getElementById('localVideo')
localVideo.addEventListener('loadedmetadata', function() {
  console.log(`Local video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
})

let localStream;
let pc1;
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

function getName(pc) {
  return (pc === pc1) ? 'pc1' : 'pc2';
}

function getOtherPc(pc) {
  return pc1;
}

async function start() {
  console.log('Requesting local stream');
  startButton.disabled = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
    console.log('Received local stream');
    localVideo.srcObject = stream;
    localStream = stream;
    callButton.disabled = false;
  } catch (e) {
    alert(`getUserMedia() error: ${e.name}`);
  }
}

async function call() {
  callButton.disabled = true;
  hangupButton.disabled = false;
  console.log('Starting call');
  startTime = window.performance.now();
  const videoTracks = localStream.getVideoTracks();
  const audioTracks = localStream.getAudioTracks();
  if (videoTracks.length > 0) {
    console.log(`Using video device: ${videoTracks[0].label}`);
  }
  if (audioTracks.length > 0) {
    console.log(`Using audio device: ${audioTracks[0].label}`);
  }
  const configuration = {};
  console.log('RTCPeerConnection configuration:', configuration);
  pc1 = new RTCPeerConnection(configuration);
  console.log('Created local peer connection object pc1');
  pc1.addEventListener('icecandidate', e => onIceCandidate(pc1, e));

  localStream.getTracks().forEach(track => pc1.addTrack(track, localStream));
  console.log('Added local stream to pc1');

  try {
    console.log('pc1 createOffer start');
    const offer = await pc1.createOffer(offerOptions);
    await onCreateOfferSuccess(offer);
  } catch (e) {
    onCreateSessionDescriptionError(e);
  }
}

function onCreateSessionDescriptionError(error) {
  console.log(`Failed to create session description: ${error.toString()}`);
}

async function onCreateOfferSuccess(desc) {
  socket.send(JSON.stringify({sdp: desc.sdp}))
  console.log('pc1 setLocalDescription start')
  try {
    await pc1.setLocalDescription(desc);
    onSetLocalSuccess(pc1);
  } catch (e) {
    onSetSessionDescriptionError();
  }
}

function onSetLocalSuccess(pc) {
  console.log(`${getName(pc)} setLocalDescription complete`);
}

function onSetSessionDescriptionError(error) {
  console.log(`Failed to set session description: ${error.toString()}`);
}

async function onIceCandidate(pc, event) {

  socket.send(JSON.stringify({ice: event.candidate}))
}

function onAddIceCandidateSuccess(pc) {
  console.log(`${getName(pc)} addIceCandidate success`);
}

function onAddIceCandidateError(pc, error) {
  console.log(`${getName(pc)} failed to add ICE Candidate: ${error.toString()}`);
}

function onIceStateChange(pc, event) {
  if (pc) {
    console.log(`${getName(pc)} ICE state: ${pc.iceConnectionState}`);
    console.log('ICE state change event: ', event);
  }
}

function hangup() {
  console.log('Ending call');
  pc1.close();
  pc1 = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
}
