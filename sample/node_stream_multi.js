const http = require('http');
const Stream = require('node-rtsp-stream');

const server = http.createServer();

var streams=[];


	JSON.parse('{"videos":['
+'{"id":"wss1", "rtspurl":"rtsp://...", "path":"/foo1"}'
+',{"id":"wss2", "rtspurl":"rtsp://...", "path":"/foo2"}'
+',{"id":"wss3", "rtspurl":"rtsp://...", "path":"/foo3"}'
+']}').videos.forEach(function(obj){
		console.log(obj.id + ", " + obj.rtspurl + ", " + obj.path);

		stream = new Stream({
		  name: obj.path,
		  streamUrl: obj.rtspurl,
		  width: 360,
		  height: 240,
		  ffmpegOptions: { // options ffmpeg flags
			//'-stats': '', // an option with no neccessary value uses a blank string
			//'-force_fps': 30, // options with required values specify the value after the key
			'-vf':'scale='+360+':'+240,
			'-r':'24'
		  }
		});
		
		streams.push(stream);
		})
	
server.on('upgrade', function upgrade(request, socket, head) {
	console.log(request.url);
  const pathname = request.url;
  
  var succ = false;
  
  streams.forEach(function(stream){
			if (pathname === stream.name) {
			stream.wsServer.handleUpgrade(request, socket, head, function done(ws) {
			  stream.wsServer.emit('connection', ws, request);
			  //stream.wsServer.emit('camdata', ws, request);
			});
			succ = true;
		  }
	  })
  if(!succ)
  {
    socket.destroy();
	  }
});
 
server.listen(8089);

/*
	node-rtsp-stream 을 한개의 포트 사용해서 여러 영상을 표시할 수 있게 수정한 코드이다.
	https://www.npmjs.com/package/ws#multiple-servers-sharing-a-single-https-server 의 
	Multiple servers sharing a single HTTP/S server 항목 참조.
	VideoStream 은 내부에 ws 서버를 생성해서 사용하며, 접속한 이용자에게 VideoStream 자기 자신을 전달하는 것으로 보인다.
	websocketserver 에서는 같은 포트에서 패스를 이용해서 접속자에게 각각 다른 정보를 전달하는 방안은 제공하지 않는다.
	https://www.npmjs.com/package/ws#multiple-servers-sharing-a-single-https-server 의 내용에 따르면, 
	별도의 http 서버를 구동하고, websocketserver 는 서버 없이 생성해서 http 서버가 접속자의 url 에 따라서 다른 websocketserver 를 반환해 주는 방식을 제시하고 있다.
	VideoStream 내부의 코드를 참조 했을때, stream.wsServer 를 사용해서 VideoStream 이 생성한 websocketserver 를 얻을 수 있었다. 
	VideoStream 에서 서버 생성시 noServer:true 를 값으로 줘서 port 없이 생성한 후 외부코드에서 생성한 http 서버에 해당 서버를 연결해 주었다.
	이걸로는 표시 자체는 가능하지만, 우선 동작중인 서버에서 추가를 한다거나 하는 방식은 불가능 하다는걸 염두해 둬야 함.
	*/
	
	/*
	Error: spawn ENOENT
    at errnoException (child_process.js:1011:11)
    at Process.ChildProcess._handle.onexit (child_process.js:802:34)
	에러가 발생하는 경우는 child_process 에서 ffmpeg 를 실행시키려고 시도 하는데 해당 파일을 찾지 못한 경우. ffmpeg 설치 방식에 따라서 ffmpeg alias 가 등록 되지 않는 경우가 있는거 같다. ./ffmpeg 로 코드를 수정해서 사용 했으며 알리아스 등록을 알아봐야 겠음.
	*/