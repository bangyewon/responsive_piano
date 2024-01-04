// posenet 인식오류로 가끔씩 오른손에서 되던 음정이 왼손으로 넘어갑니다..

//비디오는 좌우 반전 되있습니다.
let video;
let poseNet;
let poses = [];
let pianoImage;
let startTextVisible = false; // 시작텍스트 가시화
let stopTextVisible = false; // 멈춤 텍스트 가시화
let startTime; // 시작시간
let displayDuration = 4000; 
let pianoImageVisible = false;
let osc, playing;
let isVideoFlipped = false;
let leftWristY = 0;
let minVolume = 0.1;  // 최소 볼륨
let maxVolume = 1;   // 최대 볼륨
let volumeIncrement = 0.04;  // 볼륨 변화 폭

function preload() {
  pianoImage = loadImage("image/piano.png");
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);
  osc = new p5.Oscillator('sine');

  if (video.width > 0) {
    isVideoFlipped = (video.width !== video.elt.width);
  }

  poseNet = ml5.poseNet(video, modelReady);
  poseNet.on('pose', function(results) {
    poses = results;
  });
  video.hide();
  window.mousePressed = handleMousePressed;
}

function modelReady() {
  select('#status').html('Model Loaded');
}

function draw() {
  image(video, 0, 0, width, height); // 이미지 그리기 
  
  drawKeypoints(); // 키포인트 그리기
  drawSkeleton(); // 스켈레톤 그리기
  
  // 시작 텍스트 그리기
  if (startTextVisible) {
    fill(0, 255, 0);
    textAlign(CENTER, CENTER);
    textSize(16);
    text('연주 진행중', width / 2, 20);
  }//연주 시작전 준비하는 텍스트 그리기  
  else if (!startTextVisible && !stopTextVisible && poses.length > 0) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text('손을 올리면 연주가 3초뒤에 시작됩니다.', width / 2, height / 2);
  }

  // 멈춤 텍스트 그리기
  if (stopTextVisible) {
    fill(255, 0, 0);
    textAlign(CENTER, CENTER);
    textSize(16);
    text('연주 멈춤', width / 2, 20);
  }
 //이미지 보이기 
  if (pianoImage && pianoImageVisible) {
    let scaleFactor = 0.8;
    let scaledWidth = pianoImage.width * scaleFactor;
    let scaledHeight = pianoImage.height * scaleFactor;

    image(pianoImage, width * 1/3 - scaledWidth/3, height * 3/4 - scaledHeight / 4, 600, 200);
  }
  
  // 음량 텍스트 그리기
  fill(255,0,0);
  textAlign(RIGHT, TOP);
  textSize(16);
  text('음량: ' + nf(osc.amp().value, 1, 2), width - 10, 10);
}

// 왼손의 상하위치에 따라 볼륨을 결정
function determineVolume(leftWristY) {
  let distanceFromTop = leftWristY;
  let mappedVolume = map(distanceFromTop, 0, height / 2, maxVolume, minVolume);
  return mappedVolume;
}

// 오른손의 좌우위치에 따라 음정을 결정
function determinePitch(rightWristX) {
  let pitch;

  // 오른손의 x 위치에 따라 음정을 결정
  if (71 < rightWristX && rightWristX < 115) {
    console.log("도");
    pitch = 261.63; // 도에 해당하는 주파수
  } else if (115 < rightWristX && rightWristX < 146) {
    console.log("도#");
    pitch = 277.18; // 도#에 해당하는 주파수
  } else if (146 < rightWristX && rightWristX < 176) {
    console.log("레");
    pitch = 293.66; // 레에 해당하는 주파수
  } else if (176 < rightWristX && rightWristX < 208) {
    console.log("레#");
    pitch = 311.13; // 레#에 해당하는 주파수
  } else if (207 < rightWristX && rightWristX < 253) {
    console.log("미");
    pitch = 329.63; // 미에 해당하는 주파수
  } else if (254 < rightWristX && rightWristX < 299) {
    console.log("파");
    pitch = 349.23; // 파에 해당하는 주파수
  } else if (299 < rightWristX && rightWristX < 330) {
    console.log("파#");
    pitch = 369.99; // 파#에 해당하는 주파수
  } else if (330 < rightWristX && rightWristX < 360) {
    console.log("솔");
    pitch = 415.30; // 솔에 해당하는 주파수
  } else if (360 < rightWristX && rightWristX < 392) {
    console.log("솔#");
    pitch = 415.30; // 솔#에 해당하는 주파수
  } else if (392 < rightWristX && rightWristX < 421) {
    console.log("라");
    pitch = 440.00; // 라에 해당하는 주파수
  } else if (421 < rightWristX && rightWristX < 455) {
    console.log("라#");
    pitch = 466.16; // 라#에 해당하는 주파수
  } else if (454 < rightWristX && rightWristX < 500) {
    console.log("시");
    pitch = 493.88; // 시에 해당하는 주파수
  } else if (500 < rightWristX && rightWristX < 546) {
    console.log("높은 도");
    pitch = 523.25; // 높은 도에 해당하는 주파수
  } else if (546 < rightWristX && rightWristX < 577) {
    console.log("높은 도#");
    pitch = 554.37; // 높은 도#에 해당하는 주파수
  } else if (577 < rightWristX && rightWristX < 625) {
    console.log("높은 레");
    pitch = 587.33; // 높은 레에 해당하는 주파수
  }

  return pitch;
}

// playOscillator 
function playOscillator(leftWristY, rightWristX) {
  // 딜레이를 주기 위해 setTimeout 사용
  setTimeout(function() {
    osc.start();
    
    // 왼손의 y 위치에 따라 볼륨 크기 
    let volume = determineVolume(leftWristY);
    osc.amp(volume, 0.1);

    // 오른손의 x 위치에 따라 음정을 결정
    let pitch = determinePitch(rightWristX);
    // 주파수를 pitch로 주고 pitch 달리해서 음에맞게 주파수 냄
    osc.freq(pitch, 0.1);
  }, 1800); // 1800ms 딜레이됨
}

function stopOscillator() {
  osc.amp(0, 0.5); 
}

function handleMousePressed() {
  console.log("해당좌표:", mouseX, mouseY);
}
// 키포인트
function drawKeypoints() {
  let leftWristUp = false;
  let rightWristUp = false;
  let rightWristX;
  let rightWristY;

  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i].pose;

    for (let j = 0; j < pose.keypoints.length; j++) {
      let keypoint = pose.keypoints[j];
      let keypointName = keypoint.part;

      // 왼손이 화면의 2/3보다 위에 있으면 true
      if (keypointName === "leftWrist") {
        leftWristY = keypoint.position.y;
        if (keypoint.position.y < height * 2/3) {
          leftWristUp = true;
        }
      }

      // 오른손이 화면의 2/3보다 위에 있으면 true
      if (keypointName === "rightWrist") {
        rightWristX = keypoint.position.x;
        rightWristY = keypoint.position.y;
        if (keypoint.position.y < height * 2/3) {
          rightWristUp = true;
        }
      }
    }
  }

  // 양손이 모두 위에 있으면 시작 텍스트 및 피아노 이미지 활성화
  if (leftWristUp && rightWristUp && !startTextVisible) {
    startTextVisible = true;
    stopTextVisible = false;
    startTime = millis();
    pianoImageVisible = true;

    // 키포인트의 x, y 위치에 따라 소리 재생
    playOscillator(leftWristY, rightWristX);
  }

  // 화면에 어느 한 손목이라도 보이지 않으면 연주 멈춤 텍스트 가시성 활성화
  if ((!leftWristUp || !rightWristUp) && startTextVisible) {
    startTextVisible = false;
    startTime = millis();
    stopTextVisible = true;
    if (!leftWristUp) {
      stopOscillator();
    } else if (!rightWristUp) {
      stopOscillator();
    }
  }

  // 텍스트가 화면에 표시된 후 displayDuration 이후에 가시성 비활성화
  if (startTextVisible && millis() - startTime > displayDuration) {
    startTextVisible = false;
    stopTextVisible = false;
    stopOscillator();
  }

  // 양손이 모두 내려가면 소리 멈춤 + 연주멈춤
  if (!leftWristUp && !rightWristUp) {
    stopOscillator();
  }
}
// 스켈레톤 그리기 
function drawSkeleton() {
  for (let i = 0; i < poses.length; i++) {
    let skeleton = poses[i].skeleton;
    for (let j = 0; j < skeleton.length; j++) {
      let start = skeleton[j][0];
      let end = skeleton[j][1];
      stroke(255, 0, 0);

      // 스켈레톤을 그릴 때 좌우 반전을 고려해 위치 조정하기
      let startX = isVideoFlipped ? width - start.position.x : start.position.x;
      let endX = isVideoFlipped ? width - end.position.x : end.position.x;

      line(startX, start.position.y, endX, end.position.y);
    }
  }
}
