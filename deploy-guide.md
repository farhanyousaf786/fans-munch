#1
make apis live in client/.env
make apis live in root/.env

#2
make logrocket live in client/app.js

#3
cd client
npm run build
cp -r build ../server/
cd ..
git add .
git commit -m "Updated to live Stripe keys"
git branch -D heroku-deploy
git subtree split --prefix server -b heroku-deploy
git push heroku heroku-deploy:main --force