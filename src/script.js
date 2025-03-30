import './style.css'
import * as THREE from 'three'
// import * as dat from 'dat.gui'

//////////////////

import { loadAssets } from "./loaders.js"
import {setup} from "./setup"


function main() {

// BASIC SETUP

var {scene,camera,renderer} = setup;

var timeObject = { value: 0 };
loadAssets(timeObject);

// RENDER LOOP


class Shoe{
    constructor(color, size, price){
        this.color=color
        this.size=size
        this.price=price
    }
    printsize(){
        console.log(this.size)
    }
}
let shoe= new Shoe("Red", 10, 100)
//console.log(shoe)
//shoe.printsize()


class Jordan extends Shoe{
    constructor(color, size, price, logo){
        super(color, size, price)
        this.logo=logo
    }
}
let jordan = new Jordan("purple", 12, 200, "Jumpman")
//console.log(jordan)
//jordan.printsize()

const geometry = new THREE.BoxGeometry( .5, .5, .5 );
const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
const mesh = new THREE.Mesh( geometry, material );
mesh.position.x=1
mesh.position.y=1
mesh.position.z=1
scene.add( mesh );

const geometry2 = new THREE.BoxGeometry( .5, .5, .5 );
const material2 = new THREE.MeshBasicMaterial( { color: 0xff00ff } );
const mesh2 = new THREE.Mesh( geometry2, material2 );
mesh2.position.x=-1
mesh2.position.y=-1
mesh2.position.z=1
scene.add( mesh2 );



const geometryplane = new THREE.PlaneGeometry( 4, 4 );
const materialplane = new THREE.MeshBasicMaterial( { color: 0x0000ff } );
const meshplane = new THREE.Mesh( geometryplane, materialplane );
scene.add( meshplane );

window.addEventListener("keydown", onkeypressed )


function onkeypressed(event){
    if(event.key=="ArrowDown"){
        mesh.position.y=mesh.position.y-.25
        delete_item()
    }
    if(event.key=="ArrowUp"){
        mesh.position.y=mesh.position.y+.25
        delete_item()
    }
    if(event.key=="ArrowLeft"){
        mesh.position.x=mesh.position.x-.25
        delete_item()
    }
    if(event.key=="ArrowRight"){
        mesh.position.x=mesh.position.x+.25
        delete_item()
    }
    console.log(event.key)
}



function delete_item(){
    let distance = mesh.position.distanceTo(mesh2.position)
    if (distance<=0.7071067811865476){
        mesh2.visible= false
    }
    console.log(distance)
}



function render(time)
{   
    timeObject.value = time*0.001;

    renderer.render(scene,camera);
    requestAnimationFrame ( render );
}

requestAnimationFrame ( render );

}

main();




