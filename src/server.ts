import express, { response } from 'express';
import bodyParser from 'body-parser';
import { filterImageFromURL, deleteLocalFiles } from './util/util';
import { V0MODELS } from './model.index';
import { sequelize } from './sequelize';
import { requireAuth } from './controllers/v0/users/routes/auth.router';
import { IndexRouter } from './index.router';

(async () => {
  await sequelize.addModels(V0MODELS);
  await sequelize.sync();

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;

  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  //CORS Should be restricted
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:8100");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
  });


  //Root Endpoint for users
  app.use('/users', IndexRouter)


  // Root Endpoint
  // Displays a simple message to the user
  app.get("/", async (req, res) => {
    res.status(200).send("Welcome to my Udagram Project powered By MOUHAMAD DIACK - Udacity’s School of Cloud Computing.\n In this project, I will develop a cloud-based application for uploading and filtering images!");
  });

  // @TODO1 IMPLEMENT A RESTFUL ENDPOINT
  app.get("/filteredimage/", requireAuth, async (req, res) => {
    try {
      //Check if the image_url query is valide
      const { image_url } = req.query;
      if (!image_url) {
        return res.status(400).send({ error: 'Image url is required' });
      }

      //Call filterImageFromURL(image_url) to filter the image
      const image_path = await filterImageFromURL(image_url.toString());

      //Send the resulting file in the response
      res.status(200).sendFile(image_path);

      //Deletes any files on the server on finish of the response
      res.on('finish', () => deleteLocalFiles([image_path]));

    } catch {

      //Send error message if error occured
      return res.status(422).send({ error: 'Could not process image' });
    }
  });

  //! END @TODO1

  // Start the Server
  app.listen(port, () => {
    console.log(`server running http://localhost:${port}`);
    console.log(`press CTRL+C to stop server`);
  });
})();