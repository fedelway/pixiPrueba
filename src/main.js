let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}

PIXI.utils.sayHello(type)

//Global objects
var mask;
var selectedSprite;

//Configuration
var resizeAmmount = 1;

//Create aliases
let Application = PIXI.Application,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    Sprite = PIXI.Sprite;

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

//load an image and run the `setup` function when it's done
loader
.add("res/cat.png")
.add("res/remera.png")
.add("res/remera-2.png")
.add("res/limit.png")
.add("res/mask.jpg")
.add("res/buttonLoad.png")
.add("res/buttonSizeUp.png")
.add("res/buttonSizeDown.png")
.load(setup);

app.stage.sortableChildren = true;

var meridian = new PIXI.Rectangle(app.renderer.width/2,0,1,app.renderer.height);

document.getElementById('fileInput').hidden = true;
document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
function handleFileSelect(evt) {
	let reader = new FileReader();
	reader.onabort = function(e) {
		alert('File read cancelled');
	};
	reader.onerror = ev => console.error(ev);
	reader.onload = function(e) {
		let tex = PIXI.Texture.from(reader.result);
		let newSprite = new PIXI.Sprite(tex);
		resizeWidth(newSprite, 200);
		setInCenter(newSprite);
		makeDraggable(newSprite);
		newSprite.mask = mask;
		app.stage.addChild(newSprite);
	};
	// Read in the image file as a binary string.
	reader.readAsDataURL(evt.target.files[0]);
}

//This `setup` function will run when the images have loaded
function setup() {
	//Create the cat sprite
	let bicho = new Sprite(resources["res/cat.png"].texture);
	let remera = new Sprite(resources["res/remera-2.png"].texture);
	let limit = new Sprite(resources["res/limit.png"].texture);
	mask = new Sprite(resources["res/mask.jpg"].texture);
	
	//Uso esta remera para resizear la remera-2, porque el limite esta hecho en base al tamaño del original.
	let remera2 = new Sprite(resources["res/remera.png"].texture);
	remera2.scale.set(0.8,0.8);

	let aspectRatio = remera.width / remera.height;
	remera.width = remera2.width;
	remera.height = remera.width / aspectRatio;

	/*
	console.log( "width: " + remera.width + " height: " + remera.height);
	console.log( "width/height: " + remera.width/remera.height + "height/width " + remera.height/remera.width )
	
	console.log( "width: " + remera2.width + " height: " + remera2.height);
	console.log( "width/height: " + remera2.width/remera2.height + "height/width " + remera2.height/remera2.width )
*/
	limit.scale.set(0.8,0.8);
	mask.scale.set(0.8,0.8);

	remera.width = remera2.width;
	remera.height = remera2.height;

	//Posiciono la remera en el centro
	setInCenter(remera);
	setInCenter(limit);
	setInCenter(mask);
	setInCenter(bicho);

	app.stage.addChild(remera);
	app.stage.addChild(limit);
	//Hay que agregar la mask al stage para que tome las posiciones....
	app.stage.addChild(mask);
	//app.stage.addChild(bicho);

	bicho.mask = mask;
	makeDraggable(bicho);

	let graphics = new PIXI.Graphics();
	graphics.beginFill(0xFFFF00);
	graphics.lineStyle(1,0xFF0000);
	graphics.drawPolygon(new PIXI.Polygon(app.renderer.width/2,0,app.renderer.width/2,app.renderer.height));
	app.stage.addChild(graphics);	

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
						selectedSprite.height+= resizeAmmount; selectedSprite.width+= resizeAmmount;
					}
				};
			}
		},
		{
			textureName: "res/buttonSizeDown.png",
			setEvents: sprite => {
				sprite.pointertap = e => {
					if(selectedSprite){
						selectedSprite.height-=resizeAmmount ; selectedSprite.width-= resizeAmmount;
					}
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
	this.zIndex = 1;
	this.clicked = true;
	this.eventData = event.data;
	this.oldPos = this.eventData.getLocalPosition(this.parent);
	selectedSprite = this;
}

function onEndDrag(event)
{
	this.zIndex = 0;
	this.clicked = false;
	this.eventData = null;
}

function onDragMove(event)
{
	if(this.clicked){

		var newPos = this.eventData.getLocalPosition(this.parent);

		let deltaX = newPos.x - this.oldPos.x;
		let deltaY = newPos.x - this.oldPos.y;
		
		//Lock X-Axis on center
		let recX = this.x + deltaX + this.width/2 - this.magnetArea/2;
		let recY = this.y + deltaY + this.height/2 - this.magnetArea/2;
	
		let rec = new PIXI.Rectangle( recX,recY,this.magnetArea,this.magnetArea);
		//Don't Lock if Shift-key is pressed
		if( hitTestRect(rec,meridian) && !pkeys[16] ){ 
			console.log("Collision");
			this.position.x = meridian.x - this.width/2;
			deltaX = 0;
		}
		else deltaX = newPos.x - this.oldPos.x;

		deltaY = newPos.y - this.oldPos.y;

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

var pkeys=[];
window.onkeydown = function (e) {
    var code = e.keyCode ? e.keyCode : e.which;
    pkeys[code]=true;
}
window.onkeyup = function (e) {
  var code = e.keyCode ? e.keyCode : e.which;
  pkeys[code]=false;
};