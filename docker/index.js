const Docker=require('dockerode')
const express=require('express')
const docker=new Docker();

const app=express()

app.use(express.json())

const PORT_TO_CONTAINER={

}


const CONTAINER_TO_PORT={

}

app.get('/containers',async (req,res)=>{
    try{
    const containers=await docker.listContainers();
    const containerData=containers.map(container=>({
        id: container.Id,
        name: container.Names,
        image: container.Image
    }));
    return res.json({containers: containerData})

}catch(error){
    console.error('Error fetching containers : ', error)
    return res.json({error: 'Error fetching container'})
}
})

app.post('/create-container',async(req,res)=>{
        const{ image } = req.body
        await docker.pull(image)

        const availablePort=(()=>{
            for(let i=8000;i<8999;i++){
                if(PORT_TO_CONTAINER[i]) continue
                return `${i}`
            }
        })()
        
        if(!availablePort){
            return res.json({error: 'No available PORT'})
        }
        if(!image){
            throw new Error('Image not available locally')
        }

        const container=await docker.createContainer({
            Image: image,
            Cmd: ['sh'],
            AttachStdout: true,
            Tty: true,
            HostConfig: {
                PortBindings: {
                    '80/tcp': [{HostPort: availablePort}]
                }
            }
        })

        PORT_TO_CONTAINER[availablePort]=container.id
        CONTAINER_TO_PORT[container.id]=availablePort

        await container.start()

})
const PORT=process.env.PORT || 5000
app.listen(PORT,()=>{
    console.log(`Server running at ${PORT}`);
})

