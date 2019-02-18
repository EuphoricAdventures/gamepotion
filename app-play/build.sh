cd src;
  npm i;
  npm run build;
cd ..;

docker stop gamepotion-app-play;
docker rm gamepotion-app-play;
docker build -t gamepotion-app-play .;

docker tag gamepotion-app-play eu.gcr.io/thegmc-219013/gamepotion-app-play:latest;
docker push eu.gcr.io/thegmc-219013/gamepotion-app-play:latest;
