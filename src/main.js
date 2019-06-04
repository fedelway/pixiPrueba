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

app.stage.interactive = false;

//load an image and run the `setup` function when it's done
loader
.add("res/cat.png")
.add("res/remera.png")
.add("res/remera-2.png")
.add("res/limit.png")
.add("res/mask.jpg")
.load(setup);

app.stage.sortableChildren = true;

//This `setup` function will run when the image has loaded
function setup() {
	//Create the cat sprite
	let bicho = new Sprite(resources["res/cat.png"].texture);
	let remera = new Sprite(resources["res/remera-2.png"].texture);
	let limit = new Sprite(resources["res/limit.png"].texture);
	let mask = new Sprite(resources["res/mask.jpg"].texture);
	
	//Uso esta remera para resizear la remera-2, porque el limite esta hecho en base al tamaño del original.
	let remera2 = new Sprite(resources["res/remera.png"].texture);
	remera2.scale.set(0.5,0.5);

	let aspectRatio = remera.width / remera.height;
	remera.width = remera2.width;
	remera.height = remera.width / aspectRatio;

	/*
	console.log( "width: " + remera.width + " height: " + remera.height);
	console.log( "width/height: " + remera.width/remera.height + "height/width " + remera.height/remera.width )
	
	console.log( "width: " + remera2.width + " height: " + remera2.height);
	console.log( "width/height: " + remera2.width/remera2.height + "height/width " + remera2.height/remera2.width )
*/
	makeDraggable(bicho);
	
	limit.scale.set(0.5,0.5);
	//remera.scale.set(0.5,0.5);
	mask.scale.set(0.5,0.5);

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
	app.stage.addChild(bicho);

	bicho.mask = mask;
	bicho.mask.scale.set(0.5,0.5);
	setInCenter(bicho.mask);

	/*let collection = new PIXI.Container();
	collection.addChild(bicho);
	collection.mask = mask;

	app.stage.addChild(collection);*/

	app.ticker.add( delta => collisionBehavior(bicho,remera) );
}

function setInCenter(element){
	element.position.x = app.renderer.width / 2 - element.width/2;
	element.position.y = app.renderer.height / 2 - element.height/2;
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
}

function onStartDrag(event)
{
	this.zIndex = 1;
	this.clicked = true;
	this.eventData = event.data;
	this.oldPos = this.eventData.getLocalPosition(this.parent);
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