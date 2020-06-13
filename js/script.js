var Physics = Physics || {};

let color = '#ffffff',
run = true,
mousedown;

let environment,
weightSettings;

let Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Constraint = Matter.Constraint,
    Composite = Matter.Composite,
    Composites = Matter.Composites,
    Common = Matter.Common,
    Events = Matter.Events,
    MouseConstraint = Matter.MouseConstraint,
    Mouse = Matter.Mouse,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Vector = Matter.Vector;

let render,
runner,
engine,
world;

class Environment {
    constructor(pageHeight, pageWidth) {
        this.height = pageHeight;
        this.width = pageWidth;
        this.centerX = this.width/2;
        this.centerY = this.height/2;
        this.pause = () => {
            if(run) {
                Runner.stop(runner);
                run = false;
            } else {
                Runner.start(runner, engine);
                run = true;
            }
        }
        this.clear = () => {
            World.clear(world);
            Engine.clear(engine);
            Render.stop(render);
            Runner.stop(runner);
            render.canvas.remove();
            render.canvas = null;
            render.context = null;
            render.textures = {};
            Physics.sandbox();
        };
    }
}

class PendulumSettings {
    constructor() {
        this.bars = 2;
        this.width = 50;
        this.length = 500;
    }
}

class WeightSettings {
    constructor() {
        this.size = 100;
    }
}

function guiSetup(pageHeight, pageWidth) {
    environment = new Environment(pageHeight, pageWidth);
    pendulumSettings = new PendulumSettings();
    weightSettings = new WeightSettings();

    let gui = new dat.GUI();

    let pendulumData = gui.addFolder('Pendulum Settings');
    pendulumData.add(pendulumSettings, 'bars', 1, 5, 1);
    pendulumData.add(pendulumSettings, 'length', 100, 1000, 100);
    pendulumData.add(pendulumSettings, 'width', 5, 100, 5);

    gui.add(environment, 'pause');
    gui.add(environment, 'clear');
}

Physics.sandbox = () => {
    engine = Engine.create({
        engableSleeping: true
    }),

    world = engine.world;
    
    render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            width: environment.width,
            height: environment.height,
            wireframes: false
        }
    });

    Render.run(render);
    Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: environment.width, y: environment.height }
    });

    runner = Runner.create();
    Runner.run(runner, engine);

    let mouse = Mouse.create(render.canvas),
    mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false
            }
        }
    });
    World.add(world, mouseConstraint);

    let pendulumGroup = Body.nextGroup(true);
    let pendulum = createPendulum(Composites, Bodies, environment, pendulumSettings, pendulumGroup);
    // let weight = createWeight(Bodies, environment, weightSettings, pendulumGroup);
    // Composite.add(pendulum, weight);
    
    Composites.chain(pendulum, 0.45, 0, -0.45, 0, {
        stiffness: 0, 
        length: 0,
        angularStiffness: 0
    });
    
    
    Composite.add(pendulum, Constraint.create({
        bodyB: pendulum.bodies[0],
        pointB: { x: -pendulumSettings.length/2+25, y: 0 },
        pointA: { x: environment.centerX, y: pendulum.bodies[0].position.y },
        stiffness: 1,
        length: 0,
        render: {
            strokeStyle: '#4a485b'
        }
    }));
    
    world.gravity.scale = 0.008;

    World.add(world, pendulum);
}

function createPendulum(Composites, Bodies, environment, pendulumSettings, pendulumGroup) {
    return Composites.stack(environment.centerX,environment.height/3,pendulumSettings.bars,1,0,0, (x,y) => {
        return Bodies.rectangle(x,y,pendulumSettings.length,pendulumSettings.width, {
            collisionFilter: { group: pendulumGroup },
            mass: 20,
            friction: 0,
            frictionAir: 0,
            chamfer: 20,
            render: {
                wireframes: true
            }
        })
    })
}

function createWeight(Bodies, environment, weightSettings, pendulumGroup) {
    return Bodies.circle(0, 0, weightSettings.size, {
        collisionFilter: { group: pendulumGroup },
        render: {
            strokeStyle: '#ffffff',
            lineWidth: 3
        }
    })
}

window.onload = () => {
    let pageHeight = document.body.clientHeight*2,
    pageWidth = document.body.clientWidth*2;

    guiSetup(pageHeight, pageWidth);
    Physics.sandbox();
}
