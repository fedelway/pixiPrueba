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

//Configuration
var config = {
	resizeAmmount: 10,
	bigMovementAmmount: 10,
	scaling: 0.9
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
.load(setup);

var meridian = new PIXI.Rectangle(app.renderer.width/2,0,1,app.renderer.height);
var horizontal;

document.getElementById('fileInput').hidden = true;
document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
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
			resizeHeight(newSprite, 200);
			setInCenter(newSprite);
			makeDraggable(newSprite);
			newSprite.zIndex = app.stage.maxZ;
			//newSprite.mask = mask;
			newSprite.originalData = {
				aspectRatio: getAspectRatio(newSprite),
				width: newSprite.width,
				height: newSprite.height
			}
			newSprite.originalAspectRatio = getAspectRatio(newSprite);

			//For debugging position
			newSprite.interactive = true;
			newSprite.on('pointerover', (e) =>{
				console.log(e.data.global);
			});

			userImages.addChild(newSprite);
			selectedSprite = newSprite;
		});
	};
	// Read in the image file as a binary string.
	reader.readAsDataURL(evt.target.files[0]);

	//Chrome only fires the event if the file selected is different, so just empty the value to upload same pic multiple times.
	document.getElementById('fileInput').value = '';
}

//This 'setup' function will run when the images have loaded
function setup() {
	//Create the cat sprite
	let remera = new Sprite(resources["res/remera-2.png"].texture);
	limit = new Sprite(resources["res/limit.png"].texture);
	mask = new Sprite(resources["res/mask.jpg"].texture);
	
	//Uso esta remera para resizear la remera-2, porque el limite esta hecho en base al tamaño del original.
	let remera2 = new Sprite(resources["res/remera.png"].texture);
	remera2.scale.set(config.scaling,config.scaling);
	limit.scale.set(config.scaling,config.scaling);
	mask.scale.set(config.scaling,config.scaling);

	let aspectRatio = remera.width / remera.height;
	remera.width = remera2.width;
	remera.height = remera.width / aspectRatio;

	remera.width = remera2.width;
	remera.height = remera2.height;

	//Posiciono la remera en el centro
	setInCenter(remera);
	setInCenter(limit);
	setInCenter(mask);

	app.stage.addChild(remera);
	app.stage.addChild(limit);
	//Hay que agregar la mask al stage para que tome las posiciones....
	app.stage.addChild(mask);

	middleLine = createDashedLine(new PIXI.Point(app.renderer.width/2,0), new PIXI.Point(app.renderer.width/2,app.renderer.height));
	middleLine.visible = false;
	middleLine.zIndex = 999999;
	app.stage.addChild(middleLine);

	//Estos valores estan hardcodeados, deberían estan bien hechos con respecto a la mask
	horizontal = new PIXI.Rectangle(0,mask.y + mask.height*0.415,app.renderer.width,1);
	horizontalLine = createDashedLine(new PIXI.Point(0,mask.y + mask.height*0.415), new PIXI.Point(app.renderer.width,mask.y + mask.height*0.415));
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
			textureName: "res/buttonRemoveBorder.png",
			setEvents: sprite => {
				sprite.pointertap = e=> {
					if(app.stage.children.includes(limit))
						app.stage.removeChild(limit);
					else app.stage.addChild(limit);
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
	textureArray.forEach( tex => {
		let newButton = new Sprite(resources[tex.textureName].texture);
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

//Scaling not working yet...
function exportRenderExperimental(){
	console.log('Export render');
	userImages.mask = null;
	//Position obtained through debugging. TODO: get this data from mask.
	let positionHardCoded = new Point(518,314);
	
	console.log(userImages.transform);
	console.log(mask.transform);

	let userImagesOriginalPos = userImages.position.clone();
	let maskOriginalPos = mask.position.clone();

	//Move everything to be rendered at origin
	let maskPosition = mask.position.clone();
	maskPosition = positionHardCoded;

	userImages.position = new Point(0,0);
	mask.position = new Point(-positionHardCoded.x,-positionHardCoded.y);
	userImages.scale.x*=3.63;
	userImages.scale.y*=3.63;
	mask.scale.x*=3.63;
	mask.scale.y*=3.63;

	app.render();

	userImages.position = new Point(userImagesOriginalPos.x-positionHardCoded.x,userImagesOriginalPos.y-positionHardCoded.y);
	mask.position = new Point(maskOriginalPos.x-positionHardCoded.x*3.63,maskOriginalPos.y-positionHardCoded.y*3.63);
	//userImages.x -= positionHardCoded.x;
	//userImages.y -= positionHardCoded.y;
	//mask.x-=positionHardCoded.x;
	//mask.y-=positionHardCoded.y;

	console.log(userImages.position);
	console.log(userImages.children[0].width);
	console.log(userImages.children[0].height);
	console.log(mask.position);
	console.log(mask.width);
	console.log(mask.height);


	userImages.mask = null;
	//Render to texture so masking can be applied
	let renderTexture = PIXI.RenderTexture.create(800, 600);
	app.render(); //We need this to apply position updates
	app.renderer.render(userImages,renderTexture);
	
	userImages.position = new Point(0,0);
	mask.position = new Point(0,0);
	userImages.scale.x *= 0.275;
	userImages.scale.y *= 0.275;
	mask.scale.x *= 0.275;
	mask.scale.y *= 0.275;

	userImages.x = userImagesOriginalPos.x;
	userImages.y = userImagesOriginalPos.y;
	mask.position.x = maskOriginalPos.x;
	mask.position.y = maskOriginalPos.y;

	let exportSprite = new Sprite(renderTexture);
	document.body.appendChild(app.renderer.plugins.extract.image(exportSprite));
	
	console.log(userImages.transform);
	console.log(mask.transform);

	//userImages.x += maskPosition.x;
	//userImages.y += maskPosition.y;
	//mask.x += maskPosition.x;
	//mask.y += maskPosition.y;
}

function exportRender(){
	console.log('Export render');

	//Position obtained through debugging. TODO: get this data from mask.
	let positionHardCoded = new Point(518,314);

	let userImagesOriginalPos = userImages.position.clone();
	let maskOriginalPos = mask.position.clone();

	//Move everything to be rendered at origin
	let maskPosition = mask.position.clone();
	maskPosition = positionHardCoded;

	userImages.position = new Point(userImagesOriginalPos.x-positionHardCoded.x,userImagesOriginalPos.y-positionHardCoded.y);
	mask.position = new Point(maskOriginalPos.x-positionHardCoded.x,maskOriginalPos.y-positionHardCoded.y);
	
	//Render to texture so masking can be applied
	let renderTexture = PIXI.RenderTexture.create(800, 600);
	app.render(); //We need this to apply position updates
	app.renderer.render(userImages,renderTexture);

	userImages.x = userImagesOriginalPos.x;
	userImages.y = userImagesOriginalPos.y;
	mask.position.x = maskOriginalPos.x;
	mask.position.y = maskOriginalPos.y;

	let exportSprite = new Sprite(renderTexture);
	document.body.appendChild(app.renderer.plugins.extract.image(exportSprite));

	//userImages.x += maskPosition.x;
	//userImages.y += maskPosition.y;
	//mask.x += maskPosition.x;
	//mask.y += maskPosition.y;
}

function createDashedLine(startPoint, endPoint){
	let start = new Vector(startPoint.x,startPoint.y);
	let end = new Vector(endPoint.x,endPoint.y);

	let g = new PIXI.Graphics();
	g.beginFill(0xFF0000);
	g.lineStyle(1,0xFF0000);

	let lineLength = 10;
	let gap = 5;

	let direction = end.subtract(start).unit(); //unit = normalize
	let drawnLength = 0;
	let totalLength = end.subtract(start).length();

	while(drawnLength < totalLength){
		let newStart = start.add(direction.multiply(lineLength));
		g.drawPolygon([new Point(start.x,start.y),new Point(newStart.x,newStart.y)]);
		start = newStart.add(direction.multiply(gap));
		drawnLength += lineLength + gap;
	}

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