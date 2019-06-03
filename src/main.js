let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}

PIXI.utils.sayHello(type)

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

//load an image and run the `setup` function when it's done
loader
.add("res/cat.png")
.add("res/remera.png")
.load(setup);

var graphics = new PIXI.Graphics();
graphics.lineStyle(2, 0x0000FF, 1);
graphics.beginFill(0x50f442, 1);
graphics.drawRect(100, 100, 300, 300);

//app.stage.addChild(graphics);
//app.stage.mask = graphics;

app.stage.sortableChildren = true;

//This `setup` function will run when the image has loaded
function setup() {
	//Create the cat sprite
	let bicho = new Sprite(resources["res/cat.png"].texture);
	let puerta = new Sprite(resources["res/remera.png"].texture);
	
	initSprite(bicho);
	initSprite(puerta);
	
	//bicho.x = app.renderer.width / 2 - bicho.width/2;
	//bicho.y = app.renderer.height / 2 - bicho.height/2;

	bicho.x = 110;
	bicho.y = 110;
	
	bicho.anchor.x = 0.5;
	bicho.anchor.y = 0.5;
	
	//Rotar(bicho,0.1);

	bicho.rotar = true;

	app.stage.removeChild(bicho);
	var container = new PIXI.Container();
	container.addChild(bicho);
	container.mask = graphics;

	app.stage.addChild(container);

	app.ticker.add( delta => collisionBehavior(bicho,puerta) );
}

function collisionBehavior(sp1, sp2){
	if ( hitTestRectangle(sp1,sp2) )
		console.log("Collision!!!");
}

function Rotar(bicho, timeout){
	setTimeout( ()=> {
		if(bicho.rotar){
			bicho.rotation += 0.01;
		}
		Rotar(bicho,timeout);
	} , timeout);
}

function initSprite(sprite)
{
	sprite.rotar = false;

	//Add event handlers
	sprite.interactive = true;
	sprite.clicked = false;
	sprite.on("mousedown", onStartDrag );
	sprite.on("mouseup", onEndDrag );
	sprite.on("mouseupoutside", onEndDrag);
	sprite.on("mousemove", onDragMove );

	//Add to stage
	app.stage.addChild(sprite);
}

function onStartDrag(event)
{
	this.zIndex = 1;
	this.clicked = true;
	this.eventData = event.data;
	this.oldPos = this.eventData.getLocalPosition(this.parent);
	this.rotar = false;
}

function onEndDrag(event)
{
	this.zIndex = 0;
	this.clicked = false;
	this.eventData = null;

	this.rotar = true;
}

function onDragMove(event)
{
	if(this.clicked){
		var newPos = this.eventData.getLocalPosition(this.parent);
	
		this.position.x += newPos.x - this.oldPos.x;
		this.position.y += newPos.y - this.oldPos.y;

		this.oldPos = newPos;
	}
}

//Simple collision detection
function hitTestRectangle(r1, r2) {

	var ab = r1.getBounds();
	var bb = r2.getBounds();
	return ab.x + ab.width > bb.x && ab.x < bb.x + bb.width && ab.y + ab.height > bb.y && ab.y < bb.y + bb.height;
};