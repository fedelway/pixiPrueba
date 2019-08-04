let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}

//So pixiDevTools can find PIXI
window.PIXI = PIXI;

PIXI.utils.sayHello(type)

//Global objects
var mask;
var selectedSprite;
var limit; //Area to draw
var middleLine;
var horizontalLine;
var userImages;
var textPreview;

//Configuration
var config = {
	resizeAmmount: 10,
	bigMovementAmmount: 10,
	scaling: 0.9 * 0.63
}

//Create aliases
let Application = PIXI.Application,
    loader = PIXI.Loader.shared,
    resources = PIXI.Loader.shared.resources,
	Sprite = PIXI.Sprite,
	Point = PIXI.Point;

//Create a Pixi Application
let app = new PIXI.Application({ 
	width: 256,         // default: 800
	height: 256,        // default: 600
	antialias: true,    // default: false
	transparent: false, // default: false
	resolution: 1       // default: 1
		}
	);

app.renderer.backgroundColor = 0x081a60;

app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoDensity = true;
app.renderer.resize(window.innerWidth - 20, window.innerHeight - 20);

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

app.stage.interactive = false;
app.stage.sortableChildren = true;
app.stage.maxZ = 0;

//load resources asynchronously and execute setup when done
loader
.add("res/cat.png")
.add("res/remera.png")
.add("res/remera-2.png")
.add("res/limit.png")
.add("res/mask.jpg")
.add("res/buttonLoad.png")
.add("res/buttonSizeUp.png")
.add("res/buttonSizeDown.png")
.add("res/buttonDelete.png")
.add("res/buttonRestoreAspectRatio.png")
.add("res/buttonRemoveBorder.png")
.add("res/buttonGenerateRender.png")
.add("res/buttonAddText.png")
.add("res/buttonMoveBack.png")
.load(setup);

var meridian = new PIXI.Rectangle(app.renderer.width/2,0,1,app.renderer.height);
var horizontal;

//File input
document.getElementById('fileInput').hidden = true;
document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
//Download link
document.getElementById('download_render').hidden = true;
//TextMaker
document.getElementById('TextMaker').hidden = true;
{
	let txtmkrchildren = document.getElementById('TextMaker').children;
	for(let i = 0; i<txtmkrchildren.length;i++){
		txtmkrchildren[i].addEventListener('change', handleTextMakerChange);
		txtmkrchildren[i].addEventListener('keyup', handleTextMakerChange);
	}
}
document.getElementById('TextMaker-confirm').addEventListener('click', textInputConfirmation);

//This 'setup' function will run when the images have loaded
function setup() {
	//Create the sprites
	let remera = new Sprite(resources["res/remera-2.png"].texture);

	//Create the limit: a square dashedLine
	let sideLength = 348;
	limit = new PIXI.Graphics();
	limit.width = sideLength; limit.height = sideLength;
	limit.originalSideLength = sideLength;
	limit.lineStyle(3,0x000000);
	DrawDashedLine(limit,new Point(0,0),new Point(sideLength,0));
	DrawDashedLine(limit,new Point(sideLength, 0), new Point(sideLength, sideLength));
	DrawDashedLine(limit,new Point(sideLength, sideLength), new Point(0,sideLength));
	DrawDashedLine(limit,new Point(0,sideLength), new Point(0,0));

	//Position the limit on the shirt (values hardcoded)
	limit.position = new Point(269,250);

	//Create the mask
	mask = new PIXI.Graphics();
	mask.width = sideLength; mask.height = sideLength;
	mask.beginFill(0x000000,1);
	mask.drawRect(0,0,sideLength,sideLength);
	mask.endFill();
	mask.position = limit.position;

	let maskedRemera = new PIXI.Container();
	maskedRemera.addChild(remera);
	maskedRemera.addChild(limit);
	maskedRemera.addChild(mask);
	//Apply scaling
	maskedRemera.scale.set(config.scaling,config.scaling);

	//Posiciono la remera en el centro
	setInCenter(maskedRemera);

	app.stage.addChild(maskedRemera);

	middleLine = createDashedLine(new PIXI.Point(app.renderer.width/2,0), new PIXI.Point(app.renderer.width/2,app.renderer.height),1,0xFF0000);
	middleLine.visible = false;
	middleLine.zIndex = 999999;
	app.stage.addChild(middleLine);

	//Obtain the y position of the middle of the limit
	let limitPos = limit.getGlobalPosition();
	horizontalY = limitPos.y + sideLength * config.scaling / 2;
	horizontal = new PIXI.Rectangle(0,horizontalY,app.renderer.width,1);
	horizontalLine = createDashedLine(new PIXI.Point(0,horizontalY), new PIXI.Point(app.renderer.width,horizontalY),1, 0xFF0000);
	horizontalLine.visible = false;
	horizontalLine.zIndex = 999999;
	app.stage.addChild(horizontalLine);

	userImages = new PIXI.Container();
	userImages.interactive = false;
	userImages.sortableChildren = true;
	userImages.mask = mask;
	app.stage.addChild(userImages);

	addButtons([
		{
			textureName: "res/buttonLoad.png",
			setEvents: sprite => {
				sprite.pointertap = e => document.getElementById('fileInput').click()
			}
		},
		{
			textureName: "res/buttonSizeUp.png",
			setEvents: sprite => {
				sprite.pointertap = e => {
					if(selectedSprite){
						resizeHeight(selectedSprite,selectedSprite.height + config.resizeAmmount);
					}
				};
			}
		},
		{
			textureName: "res/buttonSizeDown.png",
			setEvents: sprite => {
				sprite.pointertap = e => {
					if(selectedSprite){
						resizeHeight(selectedSprite,selectedSprite.height - config.resizeAmmount);
					}
				}
			}
		},
		{
			textureName: "res/buttonDelete.png",
			setEvents: sprite => {
				sprite.pointertap = e => {
					if(selectedSprite){
						userImages.removeChild(selectedSprite);
					}
				}
			}
		},
		{
			textureName: "res/buttonRestoreAspectRatio.png",
			setEvents: sprite => {
				sprite.pointertap = e => {
					if(selectedSprite){
						//Change width or height to restore aspect ratio
						if(selectedSprite.height > selectedSprite.width)
							selectedSprite.width = selectedSprite.originalData.aspectRatio * selectedSprite.height;
						else selectedSprite.height = selectedSprite.width / selectedSprite.originalData.aspectRatio;
					}
				}
			}
		},
		{
			textureName: "res/buttonMoveBack.png",
			setEvents: sprite => {
				sprite.pointertap = e => {
					if(selectedSprite)
						selectedSprite.zIndex = Math.min.apply(Math,userImages.children.map(s => s.zIndex)) - 1;
				}
			}
		},
		{
			textureName: "res/buttonRemoveBorder.png",
			setEvents: sprite => {
				sprite.pointertap = e=> {
					limit.visible = !limit.visible;
				}
			}
		},
		{
			textureName: "res/buttonAddText.png",
			setEvents: sprite => {
				sprite.pointertap = e => {
					app.stage.removeChild(textPreview);
					showTextMaker();
				}
			}
		},
		{
			textureName: "res/buttonGenerateRender.png",
			setEvents: sprite => {
				sprite.pointertap = e => {
					exportRender();
				}
			}
		}
	]);

	app.ticker.add( delta => renderLoop(delta) );
}

function addButtons(textureArray){
	let totalX = 0;
	//Button width. Assumes buttons all have the same width
	let buttonWidth = app.renderer.width / textureArray.length;
	textureArray.forEach( tex => {
		let newButton = new Sprite(resources[tex.textureName].texture);
		resizeWidth(newButton,buttonWidth);
		newButton.x = totalX;
		totalX += newButton.width;
		newButton.y = app.renderer.height - newButton.height;
		newButton.interactive = true;
		newButton.buttonMode = true;

		tex.setEvents(newButton);

		app.stage.addChild(newButton);
	});
}

//This function executes FPS times per second.
function renderLoop(delta){
	//collisionPointRect(bicho,meridian);
}

function setInCenter(element){
	element.position.x = app.renderer.width / 2 - element.width/2;
	element.position.y = app.renderer.height / 2 - element.height/2;
}

function setInCenterDrawingArea(element){
	element.position.x = app.renderer.width / 2 - element.width /2;
	element.position.y = horizontal.y - element.height/2;
}

function collisionPointRect(sprite, line){

	let recX = sprite.x + sprite.width/2 - sprite.magnetArea/2;
	let recY = sprite.y + sprite.height/2 - sprite.magnetArea/2;

	let rec = new PIXI.Rectangle( recX,recY,sprite.magnetArea,sprite.magnetArea);

	if( hitTestRect(rec,line) )
		;//console.log("Paso por el medio");
}

function collisionBehavior(sp1, sp2){
	if ( hitTestRectangle(sp1,sp2) )
		;//console.log("Collision!!!");
}

function makeDraggable(sprite)
{
	//Add event handlers
	sprite.interactive = true;
	sprite.clicked = false;
	sprite.on("mousedown", onStartDrag );
	sprite.on("mouseup", onEndDrag );
	sprite.on("mouseupoutside", onEndDrag);
	sprite.on("mousemove", onDragMove );

	sprite.magnetArea = 8;
	sprite.center = new PIXI.Point(sprite.x + sprite.width/2 ,sprite.y + sprite.height /2);
}

function onStartDrag(event)
{
	let newZIndex = Math.max( app.stage.children.length, app.stage.maxZ ) + 1;
	this.zIndex = newZIndex;
	app.stage.maxZ = newZIndex;
	app.stage.sortDirty = true;
	this.clicked = true;
	this.eventData = event.data;
	this.oldPos = this.eventData.getLocalPosition(this.parent);
	selectedSprite = this;
}

function onEndDrag(event)
{
	//this.zIndex = 0;
	this.clicked = false;
	this.eventData = null;

	middleLine.visible = false;
	horizontalLine.visible = false;
}

function onDragMove(event)
{
	if(this.clicked){

		var newPos = this.eventData.getLocalPosition(this.parent);

		let deltaX = newPos.x - this.oldPos.x;
		let deltaY = newPos.y - this.oldPos.y;
		
		//Lock X-Axis on center
		let recX = this.x + deltaX + this.width/2 - this.magnetArea/2;
		let recY = this.y + deltaY + this.height/2 - this.magnetArea/2;
	
		let rec = new PIXI.Rectangle( recX,recY,this.magnetArea,this.magnetArea);
		//Don't Lock if Shift-key is pressed
		if( hitTestRect(rec,meridian) && !pkeys[16] ){ 
			console.log("Vertical Collision");
			middleLine.visible = true;
			this.position.x = meridian.x - this.width/2;
			deltaX = 0;
		}
		else {
			deltaX = newPos.x - this.oldPos.x;
			middleLine.visible = false;
		}
		if( hitTestRect(rec,horizontal) && !pkeys[16] ){
			console.log("Horizontal Collision");
			horizontalLine.visible = true;
			this.position.y = horizontal.y - this.height/2;
			deltaY = 0;
		}else{
			deltaY = newPos.y - this.oldPos.y;
			horizontalLine.visible = false;
		}

		//Apply movement
		this.position.x += deltaX;
		this.position.y += deltaY;

		this.center.x += deltaX;
		this.center.y += deltaY;

		// Old Position is the old position plus the delta. This to avoid having to move the 
		// mouse pointer too far away from the center
		this.oldPos = new PIXI.Point(this.oldPos.x + deltaX, this.oldPos.y+deltaY);
	}
}

function addText(){
	let txt = prompt("Ingrese el texto","Your Text");

	//prompt cancelled or no input
	if(txt === null || txt === ""){
		return;
	}

	let textSprite = new PIXI.Text(txt,
		{
			fontFamily: 'Arial',
			fontSize: 24,
			fill: 0xff1010,
			align: 'center'
		});
	
	initUserImage(textSprite);
}

function showTextMaker(){
	let element = document.getElementById('TextMaker');
	element.hidden = !element.hidden;
	//Trigger a change if text creation dialog is shown
	if(!element.hidden){
		handleTextMakerChange();
	}
}

function handleTextMakerChange(){
	app.stage.removeChild(textPreview);
	textPreview = createText();
	setInCenterDrawingArea(textPreview);

	app.stage.addChild(textPreview);
}

function textInputConfirmation(){
	app.stage.removeChild(textPreview);
	let text = createText();
	initUserImage(text);

	document.getElementById('TextMaker').hidden = true;
}

function createText(){
	let txt = document.getElementById('TextMaker-text').value;
	let txtAlignment = document.getElementById('TextMaker-text-alignment').value;
	let color = parseInt(document.getElementById('TextMaker-color').value,16);

	let fontFamily = document.getElementById('TextMaker-font-family').value;
	let fontStyle = document.getElementById('TextMaker-font-style').value;
	let fontVariant = document.getElementById('TextMaker-font-variant').value;
	let fontWeight = document.getElementById('TextMaker-font-weight').value;

	let strokeColor = parseInt(document.getElementById('TextMaker-stroke-color').value,16);
	let strokeThickness = parseInt(document.getElementById('TextMaker-stroke-thickness').value)

	let shadowEnabled = document.getElementById('TextMaker-shadow-enabled').checked;
	let shadowColor = parseInt(document.getElementById('TextMaker-shadow-color').value,16);
	let shadowAngle = parseInt(document.getElementById('TextMaker-shadow-angle').value);
	let shadowAlpha = parseFloat(document.getElementById('TextMaker-shadow-alpha').value);
	let shadowBlur = parseInt(document.getElementById('TextMaker-shadow-blur').value);
	let shadowDistance = parseInt(document.getElementById('TextMaker-shadow-distance').value);

	let textOptions = {
		fontFamily: fontFamily,
		fill: color,
		align: txtAlignment,
		fontStyle: fontStyle,
		fontVariant: fontVariant,
		fontWeight: fontWeight,
		stroke: strokeColor,
		strokeThickness: strokeThickness,
		dropShadow: shadowEnabled,
		dropShadowColor: shadowColor,
		dropShadowAngle: shadowAngle,
		dropShadowAlpha: shadowAlpha,
		dropShadowBlur: shadowBlur,
		dropShadowDistance: shadowDistance
	};

	let textSprite = new PIXI.Text(txt,textOptions);
	textSprite.resolution = 10;
	textSprite.originalData = {
		aspectRatio: getAspectRatio(textSprite),
		width: textSprite.width,
		height: textSprite.height,
		isImage: false
	};

	return textSprite;
}

//Scaling now working!!!!
function exportRender(){
	console.log('Export render');

	let min = 9999999;
	userImages.children.forEach(c => {
		console.log(c.originalData);
		if( c.originalData.isImage && Math.min(c.originalData.width,c.originalData.height) < min){
			min = Math.min(c.originalData.width,c.originalData.height);
		}
	});
	min = Math.max(1024,min);
	let resolution = {width: min, height: min};

	// res / ScaledLimitSide
	let xScaling = resolution.width / (limit.originalSideLength * config.scaling);
	let yScaling = resolution.height / (limit.originalSideLength * config.scaling);

	let originalParameters = {
		xScaling: userImages.scale.x,
		yScaling: userImages.scale.y,
		pos: userImages.position.clone()
	}

	userImages.mask = null;
	mask.visible = false;
	
	let newMask = new PIXI.Graphics();
	newMask.beginFill(0x000000,1); //Solid Black
	newMask.drawRect(0,0,resolution.width,resolution.height);
	newMask.endFill();

	//Move everything to origin, so masking can be applied there
	userImages.x -= limit.getGlobalPosition().x;
	userImages.y -= limit.getGlobalPosition().y;

	let bkpPos = userImages.position.clone();

	//Scaling at the origin
	userImages.position = new Point(0,0);
	userImages.scale.x *= xScaling;
	userImages.scale.y *= yScaling;

	userImages.x = bkpPos.x*xScaling;
	userImages.y = bkpPos.y*yScaling;

	userImages.mask = newMask;

	//Render to texture so masking can be applied
	let renderTexture = PIXI.RenderTexture.create(resolution.width,resolution.height);
	app.render(); //We need this to apply transform updates
	app.renderer.render(userImages,renderTexture);

	let exportSprite = new Sprite(renderTexture);
	let b64 = app.renderer.plugins.extract.base64(exportSprite);

	//Now we need to leave everything as it was
	userImages.position = originalParameters.pos;
	userImages.scale.set(originalParameters.xScaling,originalParameters.yScaling);
	userImages.mask = mask;
	mask.visible = true;

	//Download the generated image
	let element = document.getElementById('download_render');
	element.href = b64;
	element.click();
}

// Triggered when the user presses the Load Image button
function handleFileSelect(evt) {
	let reader = new FileReader();
	reader.onabort = function(e) {
		alert('File read cancelled');
	};
	reader.onerror = ev => alert(ev);
	reader.onload = function(e) {
		//Create a loader so it notifies when the loading has finished
		newLoader = new PIXI.Loader();
		newLoader.add(reader.result)
		.load( () => {
			let newSprite = new PIXI.Sprite(newLoader.resources[reader.result].texture);
			newSprite.originalData = {
				aspectRatio: getAspectRatio(newSprite),
				width: newSprite.width,
				height: newSprite.height,
				isImage: true
			}
			resizeHeight(newSprite, 200);
			initUserImage(newSprite);
		});
	};
	// Read in the image file as a binary string.
	reader.readAsDataURL(evt.target.files[0]);

	//Chrome only fires the event if the file selected is different, so just empty the value to upload same pic multiple times.
	document.getElementById('fileInput').value = '';
}

function initUserImage(img){
	setInCenterDrawingArea(img);
	//setInCenter(img);
	//img.y = horizontal.y - img.height/2;
	makeDraggable(img);
	img.zIndex = app.stage.maxZ;

	userImages.addChild(img);
	selectedSprite = img;
}

// Draws dashed line given a PIXI.Graphics object
function DrawDashedLine(g,startPoint, endPoint){
	let start = new Vector(startPoint.x,startPoint.y);
	let end = new Vector(endPoint.x,endPoint.y);

	let lineLength = 10;
	let gap = 5;

	let direction = end.subtract(start).unit(); //unit = normalize
	let drawnLength = 0;
	let totalLength = end.subtract(start).length();

	while(drawnLength < totalLength){
		let newStart = start.add(direction.multiply( Math.min(lineLength,totalLength-drawnLength) ));
		g.drawPolygon([new Point(start.x,start.y),new Point(newStart.x,newStart.y)]);
		start = newStart.add(direction.multiply(gap));
		drawnLength += lineLength + gap;
	}

	return g;
}

// Creates a PIXI.Graphics object with a drawn dashed line
function createDashedLine(startPoint, endPoint, lineWidth, lineColor){
	let g = new PIXI.Graphics();
	g.lineStyle(lineWidth,lineColor);
	
	DrawDashedLine(g,startPoint,endPoint);

	return g;
}

//Resizing functions keeping Aspect Ratio
function resizeHeight(img, newHeight){
	let aspectRatio = getAspectRatio(img);
	img.height = newHeight;
	img.width = aspectRatio * newHeight;
}

function resizeWidth(img, newWidth){
	let aspectRatio = getAspectRatio(img);
	img.width = newWidth;
	img.height = newWidth / aspectRatio;
}

function getAspectRatio(img){
	return img.width / img.height;
}

//Simple collision detection
function hitTestRectangle(r1, r2) {
	var ab = r1.getBounds();
	var bb = r2.getBounds();
	return ab.x + ab.width > bb.x && ab.x < bb.x + bb.width && ab.y + ab.height > bb.y && ab.y < bb.y + bb.height;
};

function hitTestRect(ab, bb) {
	return ab.x + ab.width > bb.x && ab.x < bb.x + bb.width && ab.y + ab.height > bb.y && ab.y < bb.y + bb.height;
};

//Key Presses
var keyEvents = [];
keyEvents['ArrowUp'] = ()=>{
	if(selectedSprite){
		let movementAmmount = 1;
		if(pressedKeys['Control'])
			movementAmmount = config.bigMovementAmmount;
		if(pressedKeys['Shift'])
			selectedSprite.height -= movementAmmount;
		else
			selectedSprite.y-= movementAmmount;
	}
};
keyEvents['ArrowDown'] = ()=>{
	if(selectedSprite){
		let movementAmmount = 1;
		if(pressedKeys['Control'])
			movementAmmount = config.bigMovementAmmount;
		if(pressedKeys['Shift'])
			selectedSprite.height+=movementAmmount;
		else
			selectedSprite.y+= movementAmmount;
	}
};
keyEvents['ArrowLeft'] = ()=>{
	if(selectedSprite){
		let movementAmmount = 1;
		if(pressedKeys['Control'])
			movementAmmount = config.bigMovementAmmount;
		if(pressedKeys['Shift'])
			selectedSprite.width-=movementAmmount;
		else
			selectedSprite.x-= movementAmmount;
	}
};
keyEvents['ArrowRight'] = ()=>{
	if(selectedSprite){
		let movementAmmount = 1;
		if(pressedKeys['Control'])
			movementAmmount = config.bigMovementAmmount;
		if(pressedKeys['Shift'])
			selectedSprite.width+=movementAmmount;
		else
			selectedSprite.x+= movementAmmount;
	}
};
var pkeys=[];
var pressedKeys = [];
window.onkeydown = function (e) {
	console.log(e);
    var code = e.keyCode ? e.keyCode : e.which;
	pkeys[code]=true;
	pressedKeys[e.key] = true;
	//Trigger event if present
	let event = keyEvents[e.key];
	if(event)
		event();
}
window.onkeyup = function (e) {
  var code = e.keyCode ? e.keyCode : e.which;
  pkeys[code]=false;
  pressedKeys[e.key] = false;
};