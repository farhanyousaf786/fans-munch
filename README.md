# fans-munch

## Setup

cd client
npm run build
cp -r build ../server/
cd ..
git add .
git commit -m "Updated to live Stripe keys"
git branch -D heroku-deploy
git subtree split --prefix server -b heroku-deploy
git push heroku heroku-deploy:main --force
