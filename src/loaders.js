//  Loaders

import * as THREE from 'three'
import { setup } from "./setup"
import vertShader from "./shaders/vertShader.glsl"
import fragShader from "./shaders/fragShader.glsl"
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js' 
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import {
    computeBoundsTree, disposeBoundsTree,
    computeBatchedBoundsTree, disposeBatchedBoundsTree, acceleratedRaycast,
} from 'three-mesh-bvh';

// Add the extension functions
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

THREE.BatchedMesh.prototype.computeBoundsTree = computeBatchedBoundsTree;
THREE.BatchedMesh.prototype.disposeBoundsTree = disposeBatchedBoundsTree;
THREE.BatchedMesh.prototype.raycast = acceleratedRaycast;

var { scene, renderer, camera } = setup;

export function loadAssets(timeObject) {

    const manager = new THREE.LoadingManager();

    manager.onStart = function (url, itemsLoaded, itemsTotal) {

        console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');

    };

    manager.onLoad = function () {

        console.log('Loading complete!');

        // remove preloader cover.

        // const curtain = document.getElementById("curtain");

        // curtain.style.visibility = "hidden";
        // curtain.classList.add("hidden");

    };


    manager.onProgress = function (url, itemsLoaded, itemsTotal) {

        console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
        var pct = itemsLoaded / itemsTotal;

        //scale loading bar

        // const loader = document.getElementById("loader");

        // var pxs = pct*180;
        // loader.style.width = pxs.toString() + "px";


    };

    manager.onError = function (url) {

        console.log('There was an error loading ' + url);

    };


    const gltfLoader = new GLTFLoader(manager);
    const textureLoader = new THREE.TextureLoader(manager);
    const rgbeLoader = new RGBELoader(manager);

    let key_presses={}
    let direction=new THREE.Vector3()
    let speed=.5
    let currentFallVelocity= 0;
    let currentHeight = -1;
    function setDirection(){
            let x=0
            let z=0
            let y=0
            if(key_presses["a"]==true){
                x=x-1
            }
            if(key_presses["d"]==true){
                x=x+1
            }
            if(key_presses["w"]==true){
                z=z-1
            }
            if(key_presses["s"]==true){
                z=z+1
            }
            if(key_presses[" "] == true){
                
                if(currentHeight <= 0.2){
                    // console.log("jump")
                    currentFallVelocity = 5.;
                }
            }
            direction.x=x*speed
            direction.z=z*speed
        }
    document.addEventListener("keydown", logkeytrue)
    function logkeytrue(event){
        key_presses[event.key.toLowerCase()]=true
        setDirection()
    }
    document.addEventListener("keyup", logkeyfalse)
        function logkeyfalse(event){
            key_presses[event.key.toLowerCase()]=false
            setDirection()
    }
    //load assets, create geometry,material -> mesh as needed, add meshes to the scene
    
    let raycaster = new THREE.Raycaster();
        raycaster.firstHitOnly = true;
    
        gltfLoader.load(
        // resource URL
        'Mapnew1.glb',
        // called when the resource is loaded
        function ( gltf ) {
    
            scene.add( gltf.scene );
    
            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Group
            gltf.scenes; // Array<THREE.Group>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object
            let playerMesh=null
            let terrainMesh=null
            gltf.scene.traverse((mesh)=>{
                console.log(mesh.name)
                if (mesh.name == "PlayerCharacter_armature"){
                    camera.position.copy(mesh.position)
                    camera.position.add(new THREE.Vector3(0,30,-30))
                    camera.controller.target.copy(mesh.position)
                    playerMesh=mesh
                }
                if (mesh.name =="Terrain(Starting)"){
                    mesh.geometry.computeBoundsTree();
                    terrainMesh=mesh
                }
            })
            function updatePlayer(time){

            // set player rotation from camera position
            let adj= camera.position.x-playerMesh.position.x
            let opp= camera.position.z-playerMesh.position.z
            let angle=Math.atan2(adj, opp)
            playerMesh.quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0), angle)
            // damp current velocity, add velocity from gravity
            direction.y = currentFallVelocity*0.9 + (-9.81*0.02)*0.1;
            
            currentFallVelocity = direction.y;
            // get directionClone and set it's rotation
            let directionClone=direction.clone()
            directionClone.applyAxisAngle(new THREE.Vector3(0,1,0), angle)

            // slow or speed up terrain movement based on surface normal direction
            // multiplier should be 1 or higher if in the air/jumping
            if(terrainMesh){
                let down = new THREE.Vector3(0,-1,0);

                raycaster.set(playerMesh.position,down)

                const intersectDown = raycaster.intersectObject(terrainMesh);

                // raycast down to get down surface information (to see if in the air)
                // scale y movement
                
                for ( let i = 0; i < intersectDown.length; i ++ ) {
                    let intersection = intersectDown[ i ];

                    currentHeight = intersection.distance;

                    if(directionClone.y < 0){
                        if((intersection.distance - 0.02) < -directionClone.y){
                            directionClone.y = -(intersection.distance - 0.02);
                        }
                    }
                }                
                // xz movement direciton // // see if the movement will be too much, if so scale it down
                let movementDirection = directionClone.clone();
                movementDirection.y = 0;
                raycaster.set(playerMesh.position,movementDirection)

                const intersectTerrain = raycaster.intersectObject(terrainMesh);

                for ( let i = 0; i < intersectTerrain.length; i ++ ) {
                    let intersection = intersectTerrain[ i ];

                    if(intersection.distance - 0.02 < movementDirection.length()){
                        movementDirection.setLength(intersection.distance - 0.02);
                    }
                }

                // actual movement direction // see if the movement will be too much, if so scale it down

                directionClone.x = movementDirection.x;
                directionClone.z = movementDirection.z;
                raycaster.set(playerMesh.position,directionClone)

                const intersectTerrainFinal = raycaster.intersectObject(terrainMesh);

                for ( let i = 0; i < intersectTerrainFinal.length; i ++ ) {
                    let intersection = intersectTerrainFinal[ i ];

                        // maybe bounce off of normal direction
                    if(intersection.distance - 0.02 < directionClone.length()){
                        directionClone.setLength(intersection.distance - 0.02);
                    }   
                }
            }

            // move the player
            playerMesh.position.add(directionClone)
            //raycast up and down from the player to see distance to the ground. 
            // reset the player height and fall velocity if below ground, 
            // and record the current normal and height (to see if on the ground)
            //let up = new THREE.Vector3(0,1,0)
            //let down = new THREE.Vector3(0,-1,0)

            //raycaster.set(playerMesh.position, down)

            //let intersectDown= raycaster.intersectObject(terrainMesh)
            //for ( let i = 0; i < intersectDown.length; i++ ){
            //    let intersection=intersectDown[i]
            //     playerMesh.position.y=intersection.point.y
            // }

            // raycaster.set(playerMesh.position, up)

            // let intersectup= raycaster.intersectObject(terrainMesh)
            // for ( let i = 0; i < intersectup.length; i++ ){
            //     let intersection=intersectup[i]
            //     playerMesh.position.y=intersection.point.y
            // }

            // adjust the camera based on the player movement
            camera.position.add(directionClone)
            camera.controller.target.copy(playerMesh.position)
        }
        listforfunctions.push(updatePlayer)
        },
        // called while loading is progressing
        function ( xhr ) {
    
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    
        },
        // called when loading has errors
        function ( error ) {
    
            console.log( 'An error happened' );
    
        }
    );
let listforfunctions=[]
    function update_function(time){
    for(let i=0;i<listforfunctions.length;i++){
        listforfunctions[i](time)
    }
}
return update_function
}
