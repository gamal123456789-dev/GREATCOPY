    const fileExtension = path.extname(originalFilename).toLowerCase();
    
    console.log('📁 File upload:', {
      filename: originalFilename,
      size: \`\${(file.size / 1024 / 1024).toFixed(2)} MB\`,
      extension: fileExtension,
      mimetype: file.mimetype
    });

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const finalFilename = \`\${timestamp}_\${randomString}\${fileExtension}\`;
    const finalFilePath = path.join(uploadsDir, finalFilename);

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
    const isImage = imageExtensions.includes(fileExtension.toLowerCase()) || 
                   file.mimetype?.startsWith('image/');

    if (isImage) {
      try {
        console.log('🔄 Processing image with Sharp');
        
        await sharp(file.filepath)
          .webp({ 
            quality: 85,
            effort: 4
          })
          .toFile(finalFilePath);

        console.log('✅ Image processed successfully');
        
        try {
          fs.unlinkSync(file.filepath);
        } catch (e) {
          console.warn('Could not delete original file:', e);
        }

        return res.status(200).json({
          success: true,
          url: \`/uploads/\${finalFilename}\`,
          filename: finalFilename,
          originalSize: file.size,
          message: 'Image uploaded successfully'
        });

      } catch (sharpError) {
        console.error('❌ Image processing failed:', sharpError);
        
        try {
          fs.copyFileSync(file.filepath, finalFilePath);
          fs.unlinkSync(file.filepath);
          
          console.log('✅ Image saved as original (fallback)');
          
          return res.status(200).json({
            success: true,
            url: \`/uploads/\${finalFilename}\`,
            filename: finalFilename,
            originalSize: file.size,
            fallback: true,
            message: 'Image uploaded (original format)'
          });
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          return res.status(500).json({
            error: 'Failed to process image',
            details: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
          });
        }
      }
    } else {
      console.log('📄 Processing non-image file');
      
      try {
        fs.copyFileSync(file.filepath, finalFilePath);
        fs.unlinkSync(file.filepath);
        
        console.log('✅ Non-image file saved successfully');
        
        return res.status(200).json({
          success: true,
          url: \`/uploads/\${finalFilename}\`,
          filename: finalFilename,
          originalSize: file.size,
          fileType: 'non-image',
          message: 'File uploaded successfully'
        });
      } catch (copyError) {
        console.error('❌ File copy failed:', copyError);
        return res.status(500).json({
          error: 'Failed to save file',
          details: copyError instanceof Error ? copyError.message : 'Unknown error'
        });
      }
    }

  } catch (error) {
    console.error('❌ Upload error:', error);
    return res.status(500).json({ 
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
ENDOFFILE"
cp pages/api/chat/upload.ts pages/api/chat/upload.ts.backup
rm pages/api/chat/upload.ts
pm2 restart server.js
pm2 status
cat server.js | grep -i "body\|size\|limit"
pm2 restart server.js
pm2 status
pm2 restart all 
pm2 restart server.js
pm2 status
curl -I http://localhost:5200
cat /etc/nginx/nginx.conf | grep -i "client_max_body_size"
echo "client_max_body_size 200M;" >> /etc/nginx/nginx.conf
systemctl reload nginx
pm2 restart all
pm2 restart server.js
sed -i 's/client_max_body_size 200M;/client_max_body_size 0;/' /etc/nginx/nginx.conf
echo "client_max_body_size 0;" >> /etc/nginx/nginx.conf
systemctl reload nginx
pm2 restart server.js
cd /root/MainWebsite
git checkout 835414d
rm -rf .next node_modules package-lock.json
npm install
npm run build
npx next start
PORT=5200 npx next start
PORT=5200 pm2 start npx --name gearsapp -- next start
pm2 status
sudo ufw allow 5200
sudo ufw reload
sudo ufw status
iptables -A INPUT -p tcp --dport 5200 -j ACCEPT
PORT=5200 HOST=0.0.0.0 npx next start
PORT=5200 HOST=0.0.0.0 pm2 start npx --name gearsapp -- next start
sudo nano /etc/nginx/sites-available/default
sudo systemctl restart nginx
pm2 status
pm2 start all
ss -tulnp | grep 5200
HOST=0.0.0.0 PORT=5200 npx next start
npm run build
PORT=5200 HOST=0.0.0.0 node server.js
pm2 start server.js --name gearsapp
PORT=5200 HOST=0.0.0.0 node server.js
pm2 status
rm -rf .next node_modules
npm install
npm run build
PORT=5200 HOST=0.0.0.0 node server.js
ls -la .next
PORT=5200 HOST=0.0.0.0 node server.js
nano server.js
PORT=5200 HOST=0.0.0.0 node server.js
nano server.js
rm -rf .next
npm run build
pm2 delete all
PORT=5200 HOST=0.0.0.0 pm2 start server.js --name gearsapp
ss -tulnp | grep 5200
pm2 status
sudo ufw allow 5200
sudo ufw reload
sudo nano /etc/nginx/sites-available/default
sudo systemctl restart nginx
pm2 status
curl -I http://localhost:5200
pm2 logs gearsapp
nano server.js
pm2 delete all
pm2 kill
PORT=5200 HOST=0.0.0.0 node server.js
rm -rf .next node_modules package-lock.json
npm install
npm run build
PORT=5200 HOST=0.0.0.0 node server.js
git add .
git commit -m "fsfsfs"
git pull origin main
pm2 start all
pm2 start
npm install
npm run build
npm start
pm2 start all
npm start
npm install -g pm2
pm2 start server.js --name my-app
pm2 list
pm2 save
pm2 startup
sudo env PATH=$PATH:/home/username/.nvm/versions/node/vXX.X.X/bin /home/username/.nvm/versions/node/vXX.X.X/lib/node_modules/pm2/bin/pm2 startup systemd -u username --hp /home/username
pm2 restart all
add git .
git commit -m "cursor"
git push origin main
git reset --hard
git add .
git commit -m "cursor"
git push origin main
git pull origin main --rebase
git pull origin main
git push origin main
git add .
git commit -m "cursor"
git push origin main
git add .
git commit -m "cursor2"
git pull origin main
git add .
git commit -m "new2newnew"
git pull origin main
git status
pm2 restart all
npm install sharp 
npm list sharp
git pull origin main
git add .
git commit -m "new2newnew"
git pull origin main
git add .
git commit -m "new2newnew2323"
git pull origin main
pm2 restart all
git add .
git commit -m "new2newnew2323image"
git pull origin main
pm2 restart all
git add .
git commit -m "new2newnew2323imagenew"
git pull origin main
pm2 restart all
git add .
git commit -m "new2newnew2323imagenew2333"
git pull origin main
pm2 restart all
git pull origin main
pm2 restart all
npm install multer@1.4.5-lts.1
npm install sharp@0.33.5
npm install uuid@11.1.0
npm install @types/multer@1.4.12
sudo apt update && sudo apt upgrade -y
sudo apt install -y \
mkdir -p public/uploads
chmod 755 public/uploads
chown -R $USER:$USER public/uploads
sudo chown -R www-data:www-data /var/www/gear-score/public/uploads
sudo chmod -R 755 /var/www/gear-score/public/uploads
git pull origin main
pm2 restart
pm2 restart all
git pull origin main
pm2 restart all
git pull origin main
pm2 restart all
git pull origin main
pm2 restart all
git add .
git commit -m "payment first on "
git pull origin main
pm2 restart all
git add .
git commit -m "payment first on"
git pull origin main
git status
cd /root/MainWebsite
pm2 restart all
git add .
git commit -m "let'see"
git pull origin main
pm2 restart all
git pull origin main
git add .
git commit -m "fewlo2"
git push origin main
git pull origin main
git status
pm2 restart all
git add .
git commit -m "fewlo2999"
git pull origin main
pm2 restart all
git pull origin main
cd /root/MainWebsite
git add .
git commit -m "paymentmethod"
get pull origin main
git add .
git commit -m "paymentmethod22"
get pull origin main
git add .
git commit -m "paymentgate"
get pull origin main
git pull origin main
npm install
npm run build
nano package.json
git pull origin main
npm install
cat package.json | jq .
git add package.json
git commit -m "Resolve package.json merge conflict"
git pull origin
git pull origin main
npm run build
pm2 restart all
pm2 status
git stauts
git status
cat package.json | jq .
npm install
git add package.json package-lock.json
git commit -m "Fix merge conflict in package.json"
npm run build
pm2 restart all
pm2 logs
cat package.json | jq .
rm -rf node_modules package-lock.json
npm install
npm run build
pm2 restart all 
git add .
git commit -m "Fix merge conflict in package.json233333"
git pull origin main
npm install
npm run build
pm2 restart all
sudo nano /etc/nginx/sites-available/default
sudo nginx -t 
sudo systemctl reload nginx 
pm2 restart my-app
pm2 logs gearsapp
pm2 logs gearapp
sudo nano /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl reload nginx
pm2 restart all
curl -I http://localhost:5200
sudo lsof -i -P -n | grep LISTEN
cat server.js
grep -R "listen" .
grep -R "PORT" .
Bitvise SSH Client
pm2 restart my-app
curl -I http://localhost:5200
cat server.js
cat .env
pm2 stop all
pm2 start server.js --name my-app --env production
curl -I http://localhost:5200
pm2 logs
pm2 stop my-app
npm run build
git add .
git commit -m "fixplsfix"
git pull origin main
npm run build
pm2 restart my-app
git pull origin main
git add .
git commit -m "fixplsfix333"
git pull origin main
pm2 restart all
git add .
git commit -m "sad"
git pull origin main
pm2 restart all
pm2 logs
npx prisma studio
git pull origin main
git add .
git commit -m "sad23"
git pull origin main
git add .
git commit -m "ibrahimgamal"
git pull origin main
git status
pm2 restart all
git add .
git commit -m "ibrahimgamal3323cd"
git pull origin main
git add .
git commit -m "ibrahimgamal3323cd32323"
git pull origin main
git add .
git commit -m "ibrahimgamal3323cd3232333"
git pull origin main
git add .
git commit -m "ibrahimgamal3323cd32323332323"
git pull origin main
pm2 restart all
git add .
git commit -m "ibrahimgamal3323cd32323332323payments"
git pull origin main
pm2 restart all
git add .
git commit -m "ibrahimgamal3323cd32323332323payments32323333"
git pull origin main
pm2 restart all
git add .
git commit -m "ibrahimgamal3323cd32323332323payments32323333999"
git pull origin main
pm2 restart all
git add .
git commit -m "newnewnewspaymentss"
git pull origin main
pm2 restart all
git add .
git commit -m "newnewnewspaymentss233"
git pull origin main
git add .
git commit -m "newnewnewspaymentss23322"
git pull origin main
pm2 restart all
git pull origin main
git add .
git commit -m "newnewnewspaymentss233222999"
git pull origin main
pm2 restart all
git add .
git commit -m "newnewnewspaymentss233222999"
git pull origin main
pm2 restart all
git add .
git commit -m "newnewnewspaymentss233222999233"
git pull origin main
pm2 restart all
NPX PRISMA STUDIO
npx prisma studio
git add .
git commit -m "newnewnewspaymentss2332229992339922cc"
git pull origin main
git add .
git commit -m "newnewnewspaymentss2332229992339922ccasd"
git pull origin main
pm2 restart all
git add .
git commit -m "newnewnewspaymentss2332229992339922ccasdbest"
git pull origin main
pm2 restart all
git pull origin main
pm2 restart all
git pull origin main
npx prisma studio
npx prisma db push 
npx prisma studio
cd /root/MainWebsite
git add .
git commit -m "betteridpayments"
git pull origin main
git status
pm2 restart all
git pull origin main
git commit -m "betteridpayments"
git add .
git commit -m "betteridpayments2333"
git pull origin main
rm -rf node_modules/
rm -rf .prisma/
rm -rf node_modules/.prisma/
rm package-lock.json
npm install
npx prisma generate
npm run build
npm run start
pm2 restart all
npx prisma studio
cd /roor/MainWebsite
cd /root/MainWebsite
npx prisma studio
npx prisma generate 
npx prisma migrate dev --name add-payment-id-to-order 
npx prisma migrate reset --force 
npx prisma generate 
npx prisma studio
npx prisma migrate dev --name add-reset-token
npx prisma migrate deploy
npx prisma migrate resolve --applied 20250804120939_init
npx prisma migrate deploy
npx prisam studio
npx prisma generate
npx prisam studio
npx prisma studio
sqlite3 dev.db
.schema User
npx prisma migrate dev --name add_reset_token_fields
npx prisma db push --force-reset
npx prisam studio
npx prisma studio
npx prisma generate
npx prisma studio
npx prisma db push
npx prisma generate
pm2 restart all
npx prisma studio
rm -rf node_modules
rm -rf .prisma
rm -rf node_modules/.prisma
rm package-lock.json
npm install
npx prisma generate
npx prisma studio
npx prisma -v
rm -rf node_modules/.prisma
rm -rf .prisma
rm -rf node_modules
rm package-lock.json
npm install
npx prisma generate
npm run build
npm run start
pm2 stauts
pm2 restart all
pm2 stauts
pm2 status
npx prisma studio
rm -rf node_modules/
rm -rf .prisma/
rm -rf node_modules/.prisma/
rm package-lock.json
npm install
npx prisma generate
npm run build
git pull origin main
npm run build
rm -rf node_modules/
rm -rf .prisma/
rm -rf node_modules/.prisma/
rm package-lock.json
npm install
npx prisma generate
npm run build
nano orderscontext.tsx
npm run build 
from 'prisma'
grep -rn "from 'prisma'" .
grep -rn 'from "prisma"' .
ls -la node_modules/.prisma/client
nano test.js
node test.js
rm -rf .next
npm run build
git add .
git commit -m "fromvps to pc "
git push origin main
git push origin main --force
npm run build
cd /root/MainWebsite
npx prisma studio
ssh root@62.169.19.154 "cd /root/MainWebsite && pwd && ls -la"
cd /root/MainWebsite
npm run build
sed -n '200,210p' /root/MainWebsite/context/OrdersContext.tsx
sed -i '204s/error: error.message,/error: error instanceof Error ? error.message : String(error),/' context/OrdersContext.tsx
sed -i '205s/stack: error.stack,/stack: error instanceof Error ? error.stack : undefined,/' context/OrdersContext.tsx
npm run build
sed -i 's/interface Order {/interface AdminOrder {/' pages/admin/index.tsx
sed -i 's/Order\[\]/AdminOrder\[\]/g' pages/admin/index.tsx
sed -i 's/Order\['\''status'\''\]/AdminOrder\['\''status'\''\]/g' pages/admin/index.tsx
sed -i 's/Partial<Order>/Partial<AdminOrder>/g' pages/admin/index.tsx
sed -i 's/status\?: AdminOrder\['\''status'\''\]; price\?: number; service\?: string; notes\?: string/status\?: Order\['\''status'\''\]; price\?: number; service\?: string; notes\?: string/g' pages/admin/index.tsx
npm run build
sed -i 's/order: Order/order: AdminOrder/g' pages/admin/index.tsx
npm run build
sed -i 's/Completed/completed/g' pages/orders.js
sed -i 's/In Progress/in_progress/g' pages/orders.js
sed -i 's/Pending/pending/g' pages/orders.js
sed -i 's/Cancelled/cancelled/g' pages/orders.js
npm run build
sed -n '10,20p' pages/admin/index.tsx
sed -i 's/status: '\''Pending'\'' | '\''In Progress'\'' | '\''Completed'\'' | '\''Cancelled'\'';/status: '\''pending'\'' | '\''in_progress'\'' | '\''completed'\'' | '\''cancelled'\'';/' pages/admin/index.tsx
npm run build
sed -i 's/case '\''Completed'\'':/case '\''completed'\'':/g' pages/admin/index.tsx
sed -i 's/case '\''In Progress'\'':/case '\''in_progress'\'':/g' pages/admin/index.tsx
sed -i 's/case '\''Pending'\'':/case '\''pending'\'':/g' pages/admin/index.tsx
sed -i 's/case '\''Cancelled'\'':/case '\''cancelled'\'':/g' pages/admin/index.tsx
npm run build
sed -i 's/'\''Cancelled'\''/'\''cancelled'\''/g' pages/admin/index.tsx
sed -i 's/'\''Completed'\''/'\''completed'\''/g' pages/admin/index.tsx
sed -i 's/'\''Pending'\''/'\''pending'\''/g' pages/admin/index.tsx
sed -i 's/'\''In Progress'\''/'\''in_progress'\''/g' pages/admin/index.tsx
npm run build
sed -i 's/totalEarnings: totalEarnings/totalEarnings: totalRevenue/' pages/api/admin/boosters.ts
npm run build
sed -i 's/content: /message: /' pages/api/orders.ts
npm run build
sed -i 's/timestamp: new Date(),/createdAt: new Date(),/' pages/api/orders.ts
sed -i 's/isFromUser: true,/isSystem: true,/' pages/api/orders.ts
npm run build
sed -i 's/orderId: order.id,/orderId: order.id,\n            createdAt: new Date(),\n            isSystem: true,/' pages/api/orders.ts
npm run build
sed -n '140,150p' pages/api/orders.ts
sed -i 's/userId: session.user.id,/orderId: order.id,\n            userId: session.user.id,/' pages/api/orders.ts
npm run build
sed -n '20,35p' pages/api/orders.ts
sed -i 's/orderId: order.id,/id: order.id,/' pages/api/orders.ts
sed -n '25,35p' pages/api/orders.ts
sed -i '/id: order.id,/d' pages/api/orders.ts
npm run build
sed -n '139,150p' pages/api/orders.ts
sed -i 's/userId: session.user.id,/userId: session.user.id,\n            orderId: order.id,/' pages/api/orders.ts
npm run build
sed -n '25,35p' pages/api/orders.ts
sed -i '/orderId: order.id,/d' pages/api/orders.ts
npm run build
sed -n '139,150p' pages/api/orders.ts
sed -i 's/message: `New order created: ${sanitizedGame} - ${sanitizedService} for $${validatedPrice}`,/message: `New order created: ${sanitizedGame} - ${sanitizedService} for $${validatedPrice}`,\n            orderId: order.id,/' pages/api/orders.ts
npm run build
sed -n '160,170p' pages/api/orders.ts
sed -n '155,170p' pages/api/orders.ts
sed -i '/createdAt: new Date(),/d' pages/api/orders.ts
npm run build
sed -i 's/error: error.message,/error: error instanceof Error ? error.message : String(error),/' pages/api/orders.ts
sed -i 's/stack: error.stack,/stack: error instanceof Error ? error.stack : undefined,/' pages/api/orders.ts
npm run build
sed -i 's/content: /message: /' pages/api/pay/confirm-payment.ts
sed -i 's/timestamp: new Date(),/createdAt: new Date(),/' pages/api/pay/confirm-payment.ts
sed -i 's/isFromUser: true,/isSystem: true,/' pages/api/pay/confirm-payment.ts
npm run build
sed -n '80,90p' pages/api/pay/confirm-payment.ts
sed -i 's/message: `New order created: ${game} - ${service} for $${numAmount}`,/message: `New order created: ${game} - ${service} for $${numAmount}`,\n          orderId: order.id,/' pages/api/pay/confirm-payment.ts
npm run build
sed -i 's/status: "Pending"/status: "pending"/' pages/pay/custom/[id].tsx
sed -i 's/status: "In Progress"/status: "in_progress"/' pages/pay/custom/[id].tsx
sed -i 's/status: "Completed"/status: "completed"/' pages/pay/custom/[id].tsx
sed -i 's/status: "Cancelled"/status: "cancelled"/' pages/pay/custom/[id].tsx
npm run build
sed -n '125,140p' pages/pay/custom/[id].tsx
sed -i 's/status: ((paymentResult.paymentUrl || paymentResult.payment_url) ? '\''Pending'\'' : '\''Pending'\'') as '\''Pending'\'' | '\''In Progress'\'' | '\''Completed'\'' | '\''Cancelled'\'',/status: ((paymentResult.paymentUrl || paymentResult.payment_url) ? '\''pending'\'' : '\''pending'\'') as '\''pending'\'' | '\''in_progress'\'' | '\''completed'\'' | '\''cancelled'\'',/' pages/pay/custom/[id].tsx
npm run build
pwd && ls -la
echo "test"
npm run build
cd /root/MainWebsite
npm run bulid
npm run build
grep -rl "const ServiceCard" .
grep -rl "function ServiceCard" .
nano components/ServiceCard.tsx
grep -A 5 "isProcessing=" pages/services.tsx
grep -B 5 "isProcessing=" pages/services.tsx
grep -B 10 "isProcessing=" pages/services.tsx
rm pages/services.tsx
npm run build
pm2 restart all
pm2 list
pm2 logs mainwebsite
pm2 logs gearsapp
pm2 logs
rm -rf .next
pm2 restart mainwebsite
pm2 restart all
pm2 delete
pm2 delete my-app
pm2 start npm --name "mainwebsite" -- start
npx prisma studio
rm -rf node_modules
rm -rf .prisma
rm -rf .next
rm package-lock.json
npm install
npx prisma generate
pm2 delete mainwebsite
pm2 start npm --name "mainwebsite" -- start
node test.js
npx prisma studio
git add .
git commit -m "paymenttesttip"
git pull origin main
git status
pm2 restart all
git add .
git commit -m "homeittip"
git pull origin main
git status
pm2 restart all
git status
git add .
git commit -m "homeittip96s5"
git pull origin main
git status
pm2 restart all
rm -rf .next 
Remove-Item -Recurse -Force .next 
npm run dev 
pm2 restart all
git add .
git commit -m "problemadham
git commit -m "problemadham"
git add .
git commit -m "problemadham"
git push oirgin main
git push origin main --force
git add .
git commit -m "pallbuall"
git commit -m "pallbuall233"
git add .
git commit -m "pallbuall233asdasd"
git pull origin main --force
cd /root/MainWebsite
git pull origin main
pm2 restart all
git add .
git commit -m "pallbuall233asdasd6Sd"
git pull origin main
git add .
git commit -m "pallbuall233asdasd6Sd"
git pull origin main
npm run bulid
npm run build
grep -rn "<<<<<<< HEAD" .
npm run build
pm2 restart all
git add .
git commit -m "pallbuall233asdasd6Sd323يسؤ"
git pull origin main
Git status
pm2 restart all
git add .
git commit -m "pallbuall233asdasd6Sd323يسؤc,c"
git pull origin main
pm2 restart all
git add .
git commit -m "pallbuall233asdasd6Sd323يسؤc,c223c"
git pull origin main
git status
git add .
git commit -m "ppeomsmm6633"
git pull origin main
git status
git add .
git commit -m "ppeomsmm663323"
git pull origin main
pm2 restart all
grep -rn "<<<<<<< HEAD" .
nano orders.js
Cd /root/MainWebsite
cd /root/MainWebsite
nano pages/api/orders.ts
nano pages/api/pay/confirm-payment.ts
npx prisma studio
cd /root/MainWebsite
grep -rn "<<<<<<< HEAD" .
nano pages/orders.js
grep -rn "<<<<<<< HEAD" .
git pull origin main
grep -rn "<<<<<<< HEAD" .
pm2 restart all
cd /root/MainWebsite
git add .
git commit -m "spa3rgly"
git pull origin main
git status
pm2 restart all
git pull origin main
git add .
git commit -m "spa3rgly95s"
git pull origin main
cd /root/MainWebsite
git add .
git commit -m "maybe"
git pull origin main --force
git status
git rebase --abort
git status
git pull origin main --force
لهف سفشفعس
git status
git add .
git commit -m "maybe23"
git pull origin main
git status
git fetch origin
git reset --hard origin/main
git status
git pull origin main
pm2 restart all
git pull origin main
git add .
git commit -m "asd"
git pull origin main
git status
pm2 restart all
git pull origin main
git add .
git commit -m "asd23xx"
git pull origin main
git status
pm2 restart all
git add .
git commit -m "letssmeseeee"
git pull origin main
git status
git add .
git commit -m "letssmeseeee88"
git pull origin main
git status
pm2 restart all
git add .
git commit -m "letssmeseeee8855kj"
git pull origin main
pm2 restart all
git pull origin main
git add .
git commit -m "letssmeseeee8855kj32"
git pull origin main
git status
pm2 restart all
git add .
git commit -m "letssmeseeee8855kj3man2"
git pull origin main
git status
git add .
git commit -m "letssmeseeee8855kj3man223x"
git pull origin main
git status
pm2 restart all
git add .
git commit -m "letssmeseeee8855kj3man223x23sletgo"
git pull origin main
git status
pm2 restart all
cd /root/MainWebsite
git add .
git commit -m "cryptouspaymentsnewsb"
git pull origin main
git status
pm2 restart all
git add .
git commit -m "cryptouspaymentsnewsb99"
git pull origin main
pm2 restart all
git add .
git commit -m "cryptouspaymentsnewsb9923ي"
git pull origin main
git status
git pull origin main
pm2 restart all
git add .
git commit -m "cryptouspaymentsnewsb9923ي33"
git pull origin main
pm2 restart all
git add .
git commit -m "cryptouspaymentsnewsb9923ي3332xx"
git pull origin main
git status
pm2 restart all
pm2 status
pm2 logs
npm install
npm run build
git add .
git commit -m "cryptouspaymentsnewsb9923ي3332xxad"
git pull origin main
pm2 restat all
npm run build
git add .
git commit -m "cryptouspaymentsnewsb9923ي3332xxadzz"
git add .
git commit -m "cryptouspaymentsnewsb9923ي3332xxadzz32"
git pull origin main
npm run build
pm2 restart all
pm2 status
npm run build
cd /root/MainWebsite
git add .
git commit -m "bettestyalla"
git pull origin main
git status
pm2 restart all
npm run build
pm2 status
pm2 logs
pm2 stop
pm2 stop mainwebsite
cd /root/MainWebsite
sudo cp nginx-gear-score.conf /etc/nginx/sites-available/gear-score.com
sudo systemctl reload nginx
sudo cp nginx-gear-score.conf /etc/nginx/sites-available/gear-score.com
sudo systemctl reload nginx
pm2 stop gear-score
pm2 stop mainwebsite
pm2 start ecosystem.config.js --env production
pm2 start all
cd /var/www/gear-score
sudo mkdir -p /var/www/gear-score
sudo chown -R root:root /var/www/gear-score
root@vmi2732083:~/MainWebsite# sudo mkdir -p /var/www/gear-score
sudo cp -r ~/MainWebsite/* /var/www/gear-score/
sudo chown -R root:root /var/www/gear-score
sudo cp /var/www/gear-score/nginx-gear-score.conf /etc/nginx/sites-available/gear-score.com
sudo ln -sf /etc/nginx/sites-available/gear-score.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
cd /var/www/gear-score
pm2 delete gear-score
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
curl -I http://gear-score.com
curl -I https://gear-score.com
pm2 status
cd /var/www/gear-score
pm2 start ecosystem.config.js --env production
netstat -tlnp | grep :3000
pm2 logs gear-score
cd /var/www/gear-score
node server.js
curl http://localhost:3000
pm2 status
set -e
echo '== 1) تأكيد ملف Nginx وتعديل الـ upstream على 3000 =='
CONF=/etc/nginx/sites-available/gear-score.com
if [ ! -f "$CONF" ]; then   echo "ملف $CONF غير موجود. المتاح:";   ls -la /etc/nginx/sites-available;   exit 1; fi
sudo sed -i 's/127.0.0.1:5200/127.0.0.1:3000/g' "$CONF"
= 2) تشغيل التطبيق على 3000 عبر PM2 =='
cd /root/MainWebsite
git add .
git commit -m "hassan pls make it work"
git pull origin main
git status
pm2 status
pm2 restart all
pm2 status
pm2 logs
npm run build
git add .
git commit -m "newone852174"
git checkout main
git add .
git commit -m "save work before switching to main"
git pull origin main
git status
git pull origin main
git branch backup-$(date +%Y%m%d-%H%M)
git checkout main
git pull origin main --allow-unrelated-histories
git status
pm2 status
pm2 restart all
git fetch origin
git reset --hard origin/main
git pull origin main
pm2 restart all
npm run bulid
npm run build
pm2 restart all
pm2 logs mainwebsite
صnano package.json
nano package.json
rm -rf .next node_modules
npm ci
npm run build
pm2 restart all
git pull origin main
pm2 logs mainwebsite
git add .
git commit -m "save work before switching to main23c"
gt pull origin main
git pull origin main
pm2 restart all
Npx prisam studio
npx prisma studio
npx prisma migrate
npx prisma generate
npx prisma studio
git pull origin main
pm2 restart all
pm2 start
pm2 start mainwebsite
npx prisma studio
sudo nano /etc/nginx/sites-available/mainwebsite.conf
sudo apt update
sudo apt install -y nginx
sudo ufw allow 'Nginx Full'
sudo systemctl enable nginx
sudo systemctl status nginx
sudo nano /etc/nginx/sites-available/mainwebsite.conf
sudo ln -s /etc/nginx/sites-available/mainwebsite.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginxsudo apt install -y certbot python3-certbot-nginxsudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.Gear-score.com
sudo certbot --nginx -d example.com -d www.example.com
sudo systemctl status certbot.timer
pm2 restart all
cd /var/www/gear-score
cp .env.production .env
ls -a
cp .env.example .env
nano .env
pm2 restart mainwebsite
pm2 logs mainwebsite --lines 50
npx prisma studio
npx prisma generate
npx prisma db push
pm2 restart all
npx prisma studio
git add .
git commit -m "asd23dx"
git push origin main
git status
cd /root/MainWebsite
git add .
git commit -m "teeerreess"
git pull origin main
git status
pm2 restart all

pm2 restart all
npx prisma studio
nano .env
nano .envnano .env
nano .env
pm2 restart all
notepad ".\.env"
code ".\.env"
vim .env
cd /root/MainWebsite
git add .
git commit -m "asd,a23"
git pull origin main
cd /root/MainWebiste
cd /root/MainWebsite
curl.exe -sS -D - https://gear-score.com/api/auth/providers -o NUL
curl -sS -D - -o NUL https://gear-score.com/api/auth/providers
curl -sS -D - -o NUL https://gear-score.com/api/auth/signin
curl -sS -D - -o NUL https://gear-score.com/api/auth/signin/discord
curl -sS -D - -o NUL https://www.gear-score.com/api/auth/providers
pwd
ls -la
grep -E "^(DISCORD_|NEXTAUTH_)" .env | sed 's/=.*/=***REDACTED***/'
pm2 status | cat
pm2 describe gear-score | sed -n '1,160p' | cat
pm2 logs gear-score --lines 100 | tail -n 100 | cat
curl -sS -I http://127.0.0.1:3000/api/auth/providers | cat
ss -ltnp | grep :3000 | cat
pm2 describe mainwebsite | sed -n '1,200p' | cat
grep -n "NEXTAUTH_URL=" .env | cat
curl -sS -I https://gear-score.com/auth | cat
curl -sS -I "https://gear-score.com/auth?error=discord" | cat
curl -sS -I https://gear-score.com/api/auth/callback/discord | cat
pm2 logs mainwebsite --lines 200 | tail -n 200 | cat
curl -sS https://gear-score.com/api/auth/providers | cat
pm2 logs mainwebsite --lines 200 | cat
pm2 restart mainwebsite --update-env | cat
curl -sS -D - -o NUL https://gear-score.com/api/auth/signin/discord
pm2 restart mainwebsite --update-env | cat
pm2 logs mainwebsite --lines 150 | tail -n 150 | cat
bash -lc 'set -a; source .env >/dev/null 2>&1; echo DISCORD_CLIENT_ID_LEN:${#DISCORD_CLIENT_ID}; echo DISCORD_CLIENT_SECRET_LEN:${#DISCORD_CLIENT_SECRET}; echo NEXTAUTH_SECRET_LEN:${#NEXTAUTH_SECRET}; echo NEXTAUTH_URL:${NEXTAUTH_URL}'
curl -sSL https://gear-score.com/api/auth/signin/discord | head -n 80 | cat
bash -lc 'set -a; source .env >/dev/null 2>&1; curl -sS -o /dev/null -w "%{http_code}\n" "https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&response_type=code&redirect_uri=https%3A%2F%2Fgear-score.com%2Fapi%2Fauth%2Fcallback%2Fdiscord&scope=identify%20email&prompt=consent"'
pm2 restart mainwebsite --update-env | cat
cd /root/MainWebsite
cp .env .env.bak-$(date +%F-%H%M%S)
DISCORD_CLIENT_ID="1389217214409998468"
DISCORD_CLIENT_SECRET="0GY6w9pUZ65e_D7dqFQZRUzibKnPwZn0"
# 1) ادخل مجلد المشروع واعمِل نسخة احتياطية من .env
cd /root/MainWebsite
cp .env .env.bak-$(date +%F-%H%M%S)
# 2) حدّث القيم (هنا بنكتب القيم الجديدة اللي إنت أرسلتها)
DISCORD_CLIENT_ID="1389217214409998468"
DISCORD_CLIENT_SECRET="0GY6w9pUZ65e_D7dqFQZRUzibKnPwZn0"
NEXTAUTH_URL="https://gear-score.com"
# 2.a) اكتبهم داخل .env (يستبدل لو موجود أو يضيف لو مش موجود)
grep -q '^DISCORD_CLIENT_ID=' .env && sed -i "s|^DISCORD_CLIENT_ID=.*|DISCORD_CLIENT_ID=${DISCORD_CLIENT_ID}|" .env || echo "DISCORD_CLIENT_ID=${DISCORD_CLIENT_ID}" >> .env
grep -q '^DISCORD_CLIENT_SECRET=' .env && sed -i "s|^DISCORD_CLIENT_SECRET=.*|DISCORD_CLIENT_SECRET=${DISCORD_CLIENT_SECRET}|" .env || echo "DISCORD_CLIENT_SECRET=${DISCORD_CLIENT_SECRET}" >> .env
grep -q '^NEXTAUTH_URL=' .env && sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=${NEXTAUTH_URL}|" .env || echo "NEXTAUTH_URL=${NEXTAUTH_URL}" >> .env
# (اختياري) تأكد من القيم بدون إظهار السر بالكامل
grep -E '^(DISCORD_CLIENT_ID|DISCORD_CLIENT_SECRET|NEXTAUTH_URL)=' .env
# 3) أعد تشغيل التطبيق بتحميل البيئة
pm2 restart mainwebsite --update-env
pwd
bash -lc "cd /root/MainWebsite && jq -r '.scripts.start' package.json 2>/dev/null || cat package.json | sed -n '1,120p' | cat"
sed -n '1,120p' package.json | cat
cd /root/MainWebsite
git add .
git commit -m "let'ssesee"
git pull origin main
git status
git pull origin main
git add .
git commit -m "let'ssesee23"
git pull origin main
pm2 restart all
nano .env
pm2 restart all
git add .
git commit -m "23beeeesyyy"
git pull origin main
pm2 restart all
ls -la
ls
ls -l
ls -la
chmod +x diagnose-vps-404.sh
./diagnose-vps-404.sh
chmod +x fix-vps-404.sh
./fix-vps-404.sh
# 3. اختبار النتيجة
curl https://gear-score.com/auth
cp .env.production .env
npm install
npm run build
nano .env
ssh root@62.169.19.154 "cd /root/MainWebsite && pwd && ls -la"
ssh root@62.169.19.154
cd /root/MainWebsite
node test-auth-fix.js
ls -la
cat pages/api/auth/[...nextauth].ts | head -50
cat pages/api/auth/[...nextauth].ts | grep -A 20 -B 5 "DiscordProvider"
cat .env
ls -la lib/debug*
cat lib/debug.ts
cat pages/api/auth/[...nextauth].ts | grep -A 50 "callbacks:"
cp pages/api/auth/[...nextauth].ts pages/api/auth/[...nextauth].ts.backup
sed -i 's/authorization: {/authorization: {\n        url: "https:\/\/discord.com\/api\/oauth2\/authorize",\n        params: {\n          scope: "identify email",\n          response_type: "code",\n          redirect_uri: `${process.env.NEXTAUTH_URL}\/api\/auth\/callback\/discord`,\n          prompt: "consent",\n          access_type: "offline",\n        },/' pages/api/auth/[...nextauth].ts
cat pages/api/auth/[...nextauth].ts | grep -A 15 "DiscordProvider"
cp pages/api/auth/[...nextauth].ts.backup pages/api/auth/[...nextauth].ts
sed -i '/DiscordProvider({/,/}),/c\    DiscordProvider({\n      clientId: process.env.DISCORD_CLIENT_ID!,\n      clientSecret: process.env.DISCORD_CLIENT_SECRET!,\n      authorization: {\n        url: "https://discord.com/api/oauth2/authorize",\n        params: {\n          scope: "identify email",\n          response_type: "code",\n          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/discord`,\n          prompt: "consent",\n          access_type: "offline",\n        },\n      },\n      allowDangerousEmailAccountLinking: true,\n      profile(profile) {\n        return {\n          id: profile.id,\n          name: profile.username || profile.global_name || `User${profile.id}`,\n          email: profile.email,\n          image: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,\n          role: "user",\n        };\n      },\n    ),' pages/api/auth/[...nextauth].ts
cat pages/api/auth/[...nextauth].ts | grep -A 20 "DiscordProvider"
cat pages/api/auth/[...nextauth].ts | grep -A 30 "async jwt"
sed -i '/\/\/ Handle account linking for Discord with better persistence/,/} catch (error) {/c\      // Handle account linking for Discord\n      if (account?.provider === "discord" && user?.email) {\n        try {\n          const existingUser = await prisma.user.findUnique({\n            where: { email: user.email },\n            select: { id: true, role: true, username: true, emailVerified: true, email: true }\n          });\n          \n          if (existingUser) {\n            // Link existing account\n            token.id = existingUser.id;\n            token.role = existingUser.role;\n            token.provider = "discord";\n            \n            // Update user with Discord info\n            await prisma.user.update({\n              where: { id: existingUser.id },\n              data: {\n                image: user?.image || existingUser.image,\n                name: user?.name || existingUser.username,\n                emailVerified: existingUser.emailVerified || new Date(), // Mark as verified if using Discord\n              },\n            });\n            \n            console.log("🔗 Discord account linked to existing user:", existingUser.email);\n          }\n        } catch (error) {' pages/api/auth/[...nextauth].ts
cat pages/api/auth/[...nextauth].ts | grep -A 25 "// Handle account linking for Discord"
cat pages/api/auth/[...nextauth].ts | grep -A 30 "async signIn"
sed -i '/if (!user?.email || !account?.providerAccountId) {/,/return false;/c\          if (!user?.email) {\n            console.error("❌ Discord sign-in failed: No email provided");\n            return false;\n          }' pages/api/auth/[...nextauth].ts
grep -n "Discord sign-in failed" pages/api/auth/[...nextauth].ts
cat pages/api/auth/[...nextauth].ts | grep -A 20 "cookies:"
sed -i 's/domain: undefined \/\/ Remove domain restriction to fix logout issues/domain: process.env.NODE_ENV === "production" ? ".gear-score.com" : undefined/' pages/api/auth/[...nextauth].ts
grep -A 5 "domain:" pages/api/auth/[...nextauth].ts
grep -A 5 "debug:" pages/api/auth/[...nextauth].ts
sed -i 's/debug: true, \/\/ Enable debug mode for troubleshooting/debug: process.env.NODE_ENV === "development", \/\/ Enable debug in development/' pages/api/auth/[...nextauth].ts
grep -A 2 "debug:" pages/api/auth/[...nextauth].ts
npm run build
cat pages/api/auth/[...nextauth].ts | grep -A 5 -B 5 "DiscordProvider"
sed -n '40,50p' pages/api/auth/[...nextauth].ts
sed -i 's/    ),/    }),/' pages/api/auth/[...nextauth].ts
sed -n '40,50p' pages/api/auth/[...nextauth].ts
npm run build
sed -i 's/image: user?.image || existingUser.image,/image: user?.image || undefined,/' pages/api/auth/[...nextauth].ts
sed -n '145,155p' pages/api/auth/[...nextauth].ts
npm run build
echo "Building in progress..."
pm2 list
pm2 restart mainwebsite
pm2 logs mainwebsite --lines 20
curl -s http://localhost:3000/api/auth/providers | head -5
curl -I http://localhost:3000/api/auth/providers
netstat -tlnp | grep :3000
systemctl status nginx
curl -I https://gear-score.com/api/auth/providers
curl -s http://localhost:3000/api/auth/providers
sed -n '260,275p' pages/api/auth/[...nextauth].ts
sed -n '265,270p' pages/api/auth/[...nextauth].ts
grep -n "return true;" pages/api/auth/[...nextauth].ts
grep -A 20 -B 5 "async signIn" pages/api/auth/[...nextauth].ts
cp pages/api/auth/[...nextauth].ts.backup pages/api/auth/[...nextauth].ts
sed -i '/DiscordProvider({/,/}),/c\    DiscordProvider({\n      clientId: process.env.DISCORD_CLIENT_ID!,\n      clientSecret: process.env.DISCORD_CLIENT_SECRET!,\n      authorization: {\n        url: "https://discord.com/api/oauth2/authorize",\n        params: {\n          scope: "identify email",\n          response_type: "code",\n          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/discord`,\n          prompt: "consent",\n          access_type: "offline",\n        },\n      },\n      allowDangerousEmailAccountLinking: true,\n      profile(profile) {\n        return {\n          id: profile.id,\n          name: profile.username || profile.global_name || `User${profile.id}`,\n          email: profile.email,\n          image: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,\n          role: "user",\n        };\n      },\n    }),' pages/api/auth/[...nextauth].ts
grep -A 15 "DiscordProvider" pages/api/auth/[...nextauth].ts
ls -la lib/debug*
ls -la lib/
find . -name "debug*" -type f
ls -la
pwd && ls -la
pwd
ls -la
cd /root/MainWebsite
pm2 list
systemctl status nginx
netstat -tlnp | grep :3000
netstat -tlnp | grep -E ':(80|443)'
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/providers
curl -s -o /dev/null -w "%{http_code}" https://gear-score.com/api/auth/providers
pm2 logs mainwebsite --lines 20
curl -s https://gear-score.com/api/auth/csrf
curl -s -X POST https://gear-score.com/api/auth/signout
curl -s -v https://gear-score.com/api/auth/session
cat pages/api/auth/\[...nextauth\].ts | head -50
cat pages/api/auth/\[...nextauth\].ts | tail -50
cat pages/api/auth/\[...nextauth\].ts | grep -A 20 -B 5 "session:"
pm2 restart mainwebsite
curl -s https://gear-score.com/api/auth/providers
curl -s https://gear-score.com/api/auth/csrf
curl -s -v https://gear-score.com/api/auth/session
pm2 logs mainwebsite --lines 10
curl -s -o /dev/null -w "%{http_code}" https://gear-score.com/test-auth-simple.html
ls -la test-auth-simple.html
cat > test-auth-simple.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple Auth Test - Gear Score</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .test-section {
            margin: 20px 0;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .btn {
            background: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
            text-decoration: none;
            display: inline-block;
        }
        .btn:hover {
            background: #0056b3;
        }
        .btn-success {
            background: #28a745;
        }
        .btn-danger {
            background: #dc3545;
        }
        .result {
            margin: 10px 0;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            white-space: pre-wrap;
            max-height: 200px;
            overflow-y: auto;
        }
        .success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        .error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        .info {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
        }
        .status {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 3px;
            font-weight: bold;
            margin: 5px;
        }
        .status.online {
            background: #d4edda;
            color: #155724;
        }
        .status.offline {
            background: #f8d7da;
            color: #721c24;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Simple Authentication Test - Gear Score</h1>
        <p>اختبار بسيط للمصادقة للتأكد من أن كل شيء يعمل بشكل صحيح.</p>
        
        <div class="test-section">
            <h3>🔍 اختبار حالة الخادم</h3>
            <button class="btn" onclick="testServer()">اختبار الخادم</button>
            <div id="serverResult" class="result"></div>
        </div>
        
        <div class="test-section">
            <h3>🔐 اختبار NextAuth</h3>
            <button class="btn" onclick="testNextAuth()">اختبار NextAuth</button>
            <div id="nextAuthResult" class="result"></div>
        </div>
        
        <div class="test-section">
            <h3>🍪 اختبار الكوكيز</h3>
            <button class="btn" onclick="testCookies()">اختبار الكوكيز</button>
            <div id="cookiesResult" class="result"></div>
        </div>
        
        <div class="test-section">
            <h3>🚪 اختبار تسجيل الدخول</h3>
            <a href="/auth" class="btn btn-success">اذهب لصفحة تسجيل الدخول</a>
            <button class="btn btn-danger" onclick="testSignout()">اختبار تسجيل الخروج</button>
            <div id="authResult" class="result"></div>
        </div>
        
        <div class="test-section">
            <h3>📊 الحالة العامة</h3>
            <div id="overallStatus"></div>
        </div>
    </div>

    <script>
        function log(elementId, message, type = 'info') {
            const element = document.getElementById(elementId);
            element.className = `result ${type}`;
            element.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
        }
        
        function updateStatus(status, message) {
            const statusDiv = document.getElementById('overallStatus');
            statusDiv.innerHTML = `<span class="status ${status}">${message}</span>`;
        }
        
        async function testServer() {
            try {
                log('serverResult', 'اختبار الخادم...', 'info');
                
                const response = await fetch('/');
                if (response.ok) {
                    log('serverResult', '✅ الخادم يعمل بشكل صحيح', 'success');
                    updateStatus('online', 'الخادم يعمل');
                } else {
                    log('serverResult', `⚠️ الخادم يستجيب مع أخطاء: ${response.status}`, 'error');
                    updateStatus('offline', 'مشاكل في الخادم');
                }
                
            } catch (error) {
                log('serverResult', `❌ فشل في اختبار الخادم: ${error.message}`, 'error');
                updateStatus('offline', 'الخادم غير متصل');
            }
        }
        
        async function testNextAuth() {
            try {
                log('nextAuthResult', 'اختبار NextAuth...', 'info');
                
                // Test providers
                const providersResponse = await fetch('/api/auth/providers');
                if (providersResponse.ok) {
                    const providers = await providersResponse.json();
                    log('nextAuthResult', `✅ مزودي المصادقة:\n${JSON.stringify(providers, null, 2)}`, 'success');
                } else {
                    log('nextAuthResult', `❌ فشل في مزودي المصادقة: ${providersResponse.status}`, 'error');
                }
                
                // Test CSRF
                const csrfResponse = await fetch('/api/auth/csrf');
                if (csrfResponse.ok) {
                    const csrf = await csrfResponse.json();
                    log('nextAuthResult', `✅ CSRF Token: ${csrf.csrfToken.substring(0, 20)}...`, 'success');
                } else {
                    log('nextAuthResult', `❌ فشل في CSRF: ${csrfResponse.status}`, 'error');
                }
                
                // Test session
                const sessionResponse = await fetch('/api/auth/session');
                if (sessionResponse.ok) {
                    const session = await sessionResponse.json();
                    log('nextAuthResult', `✅ Session: ${JSON.stringify(session, null, 2)}`, 'success');
                } else {
                    log('nextAuthResult', `❌ فشل في Session: ${sessionResponse.status}`, 'error');
                }
                
            } catch (error) {
                log('nextAuthResult', `❌ فشل في اختبار NextAuth: ${error.message}`, 'error');
            }
        }
        
        function testCookies() {
            try {
                log('cookiesResult', 'اختبار الكوكيز...', 'info');
                
                const cookies = document.cookie.split(';').reduce((acc, cookie) => {
                    const [key, value] = cookie.trim().split('=');
                    acc[key] = value;
                    return acc;
                }, {});
                
                const nextAuthCookies = Object.keys(cookies).filter(key => 
                    key.includes('next-auth') || key.includes('session') || key.includes('csrf')
                );
                
                if (nextAuthCookies.length > 0) {
                    log('cookiesResult', `✅ تم العثور على NextAuth cookies:\n${nextAuthCookies.join('\n')}`, 'success');
                } else {
                    log('cookiesResult', `⚠️ لم يتم العثور على NextAuth cookies`, 'info');
                }
                
                // Check localStorage
                const localKeys = Object.keys(localStorage);
                const sessionKeys = Object.keys(sessionStorage);
                
                log('cookiesResult', `LocalStorage: ${localKeys.length > 0 ? localKeys.join(', ') : 'فارغ'}`, 'info');
                log('cookiesResult', `cookiesResult`, `SessionStorage: ${sessionKeys.length > 0 ? sessionKeys.join(', ') : 'فارغ'}`, 'info');
                
            } catch (error) {
                log('cookiesResult', `❌ فشل في اختبار الكوكيز: ${error.message}`, 'error');
            }
        }
        
        async function testSignout() {
            try {
                log('authResult', 'اختبار تسجيل الخروج...', 'info');
                
                const response = await fetch('/api/auth/signout', { method: 'POST' });
                
                if (response.ok) {
                    log('authResult', '✅ تسجيل الخروج يعمل بشكل صحيح', 'success');
                    
                    // Check if session was cleared
                    setTimeout(async () => {
                        const sessionResponse = await fetch('/api/auth/session');
                        const session = await sessionResponse.json();
                        
                        if (!session.user) {
                            log('authResult', '✅ تم مسح الجلسة بنجاح', 'success');
                        } else {
                            log('authResult', '⚠️ الجلسة لا تزال موجودة بعد تسجيل الخروج', 'error');
                        }
                    }, 1000);
                    
                } else {
                    log('authResult', `❌ فشل في تسجيل الخروج: ${response.status}`, 'error');
                }
                
            } catch (error) {
                log('authResult', `❌ فشل في اختبار تسجيل الخروج: ${error.message}`, 'error');
            }
        }
        
        // Auto-run basic tests when page loads
        window.addEventListener('load', () => {
            setTimeout(() => {
                testServer();
                testNextAuth();
                testCookies();
            }, 1000);
        });
    </script>
</body>
</html>
EOF

curl -s -o /dev/null -w "%{http_code}" https://gear-score.com/test-auth-simple.html
ls -la test-auth-simple.html
ls -la | grep test
echo '<!DOCTYPE html><html><head><title>Auth Test</title></head><body><h1>Auth Test Working!</h1></body></html>' > test-auth-simple.html
ls -la test-auth-simple.html
pm2 restart mainwebsite
pm2 logs mainwebsite --lines 5
curl -s -v https://gear-score.com/api/auth/providers
pm2 list
netstat -tlnp | grep :3000
cd /root/MainWebsite
npx prisma generate
npx prisma db push
NEXTAUTH_URL=https://gear-score.com
NEXTAUTH_SECRET=your-secret-key
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
NEXT_PUBLIC_BASE_URL=https://gear-score.com
npm run dev
npm run build
cd /root/MainWebsite
npm install
rm -rf .next
rm -rf node_modules
npm install
npm run build
rm -rf .next
npm run build
npm run build -- --no-cache
rm -rf .next
rm -rf node_modules/.cache
npm run build
rm -rf node_modules package-lock.json
npm install
npm run build
npx prisma generate
cp prisma/schema.production.prisma prisma/schema.prisma
npx prisma generate
npm run build
npx prisma db push
npx prisma generate
npm run build
npx prisma generate
npm run build
npx prisma generate
npx prisma db push
npm run build
npx prisma generate
npm run build
npx prisma db push
npm run build
rm -rf .next
npm run build
npx prisma generate --force
ls -la node_modules/@prisma/client/
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client
npm install @prisma/client
npx prisma generate
npx prisma generate --schema=./prisma/schema.prisma
find . -name "schema.prisma" -type f
npm run build
rm -rf node_modules
npm install
npx prisma generate
npx prisma db push
npm run build
rm -rf node_modules
npm install
npx prisma generate
npx prisma db push
npm run build
npm run start
pm2 restart all
npm run dev
npx prisma db push
npm run dev
pm2 restart all
node -e "require('./lib/sendVerificationEmail.ts').default('test@example.com', 'test-token').catch(console.error)"
cd /root/MainWebsite
add git .
git add .
git commit -m "2ansdgc665412"
git pull origin main
git status
pm2 restart all
npm run build
npx prisma studio
git add .
git commit -m "plsworkdon'tgobad"
git pull origin main
git status
pm2 restart all
npx prisma studio
git add .
git commit -m "233mmmmmazvcv"
git pull origin main
git status
git pull origin main
git add .
git commit -m "233mmmmmazvcv554asdasd"
git pull origin main
npx prisma generate 
nano prisma/schema.prisma
npx prisma format
npx prisma generate
nano prisma/schema.prisma
npx prisma validate
npx prisma generate
npx prisma migrate dev
pm2 restart all
npx prisma studio
npm install
npm run build
ls -la
cd
ls -la
cd /root/MainWebsite
git pull origin main
pm2 restrat all
pm2 restart all
git add .
git commit -m "asndbxxx887415236"
git pull origin main
git status
nano prisma/schema.prisma
git add prisma/schema.prisma
git commit
git pull origin main
git add prisma/schema.prisma
git commit -m "lesancyc88"
git add .
git commit -m "asndbxxx88741523623zpxck"
git pull origin main
git status
pm2 restart all
pm2 logs 
git add .
git commit -m "asndbxxx88741523623zpxckjjjjj"
git pull origin main
pm2 restrat all
pm2 restart all
pm2 logs 
git add .
git commit -m "asndbxxx88741523623zpxckjjjjj8asd1"
git pull origin main
git status
pm2 restart all
pm2 logs
git add .
git commit -m "asndbxxx88741523623zpxckjjjjj8asd1poto"
git pull origin main
pm2 restart all
pm2 logs
git add .
git commit -m "asndbxxx88741523623zpxckjjjjj8asd1poto23s"
git pull origin main
pm2 restart all
git pull origin main
git stastus
git status
pm2 restart all
psql -U postgres -d gearscoredatabase -c "SELECT COUNT(*) FROM \"User\";"
# تشغيل اختبار التسجيل
node test-registration.js
pm2 restart all
# أو إذا كنت تستخدم npm
npm run dev
npx prisma generate
pm2 restart all
node test-registration.js
ls -la dev.db
pm2 restart all
# أو
npm run dev
npx prisma studio
npx prisma migrate dev --name init
npx prisma db push
node -e "require('./lib/sendVerificationEmail.ts').default('test@example.com', 'test-token').catch(console.error)"
pm2 restart all
cp .env .env.backup
touch .env.local
curl http://localhost:3000/api/auth/session
curl -X POST http://localhost:3000/api/register   -H "Content-Type: application/json"   -d '{"email":"test@example.com","password":"TestPass123","username":"testuser"}'
pm2 restart all
node reset-database.js
# 2. إعادة إنشاء قاعدة البيانات
npx prisma db push
# 3. إعادة تشغيل الخادم
npm run dev
curl -X POST http://localhost:3000/api/register   -H "Content-Type: application/json"   -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "username": "testuser"
  }'
# اختبار تسجيل الدخول
curl -X POST http://localhost:3000/api/auth/callback/credentials   -H "Content-Type: application/json"   -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
pm2 restart all
echo $NEXTAUTH_URL
echo $DISCORD_CLIENT_ID
# أو في Node.js console
node -e "console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)"
pm2 restart all
pm2 status
npm run build
pm2 start ecosystem.config.js
pm2 restart all
node -e "console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)"
node -e "console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL)"
node /root/MainWebsite/test-registration.js
pm2 restart all
node test-registration.js
PM2 RESTART ALL
cd /root/MainWebsite
node test-registration.js
PM2 RESTART ALL
pm2 restart all
echo 'DATABASE_URL="postgresql://postgres:123@localhost:5432/gearscoredatabase?schema=public"' >> .env
node test-registration.js
pm2 restart all
sudo systemctl status postgresql
pm2 restart all
echo 'DATABASE_URL="postgresql://postgres:123@localhost:5432/gearscoredatabase?schema=public"' >> .env
pm2 logs gear-score-com --lines 50
psql -U postgres -d gearscoredatabase -c "SELECT COUNT(*) FROM \"User\";"
# تشغيل اختبار التسجيل
node test-registration.js
sudo nginx -t
pm2 restart all
npx prisma generate
pm2 restart all
# أو
npm run dev
pm2 restart all
npx prisma migrate dev
prisma migrate reset
npx prisma migrate reset
pm2 restart all
npx prisma generate
npx prisma migrate dev --name init
npx prisma db push
pm2 restart all
npx prisma STUDIO
npx prisma studio
node config-production.js
sudo -u postgres createdb gearscoredatabase
npx prisma migrate deploy
npx prisma generate
npm run build
npx prisma migrate dev --name init
npx prisma generate
pm2 restart all 
npm run build
pm2 restart all
npm run build
pm2 restart all
npm run build
pm2 restart all
npm run build
pm2 restart all
touch .env
pm2 restart all
cp .env.production .env 2>/dev/null || echo "NEXTAUTH_URL=http://localhost:3000" > .env
npm run build
pm2 restart all
npm run build
rm -rf .next
rm -rf node_modules package-lock.json
npm install
npm run build
pm2 restart all
rm -f .env .env.local .env.production .envnano
nano .env
cp .env .env.local
cp .env.local .env
# تحديث قاعدة البيانات
npx prisma db push
# تشغيل الموقع
npm run dev
pm2 status
pm2 logs
sudo systemctl status nginx
sudo nginx -t
sudo systemctl start postgresql
sudo -u postgres psql -c "ALTER USER gearscore_user WITH PASSWORD '123';"
npx prisma migrate deploy
npx prisma generate
echo 'DATABASE_URL="file:./dev.db"' > temp_env
grep -v '^DATABASE_URL=' .env >> temp_env
mv temp_env .env
# 2. تشغيل migrations
npx prisma migrate deploy
# 3. إنتاج Prisma Client
npx prisma generate
npm run build
npx prisma db push
# اختبار التسجيل
node test-registration.js
echo 'EMAIL_USER="support@gear-score.com"' >> .env
echo 'EMAIL_PASS="t%C6ZiKK3R@w@!tFhe"' >> .env
echo 'NEXT_PUBLIC_BASE_URL="https://gear-score.com"' >> .env
# تحديث DATABASE_URL لـ SQLite
sed -i 's|DATABASE_URL="postgresql://.*"|DATABASE_URL="file:./dev.db"|' .env
node test-registration.js
# تشغيل migrations إذا لم تعمل من قبل
npx prisma migrate deploy
# إنتاج Prisma Client
npx prisma generate
node test-registration.js
# تشغيل migrations إذا لم تعمل من قبل
npx prisma migrate deploy
# إنتاج Prisma Client
npx prisma generate
node test-registration.js
# اختبار الموقع
curl -I https://gear-score.com
ps aux | grep node
pm2 status
pm2 restart all
cd /root/MainWebsite
npm run build
tail -f logs/error-*.log
pm2 logs
pm2 stop all
pm2 delete all
# Start with Next.js built-in server
NODE_ENV=production npm start
pm2 logs
pm2 start
pm2 start all
pm2 start mainwebsite
pm2 start server.js
pm2 logs
npx prisma studio --port 5557
npx prisma studio --port 5556
npx prisma studio
pm2 status
pm2 logs server --lines 30
curl -X POST https://gear-score.com/api/register -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"TestPass123","username":"testuser"}' -v
curl -X POST https://gear-score.com/api/auth/signin -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"TestPass123"}' -v
curl -X POST https://gear-score.com/api/auth/callback/credentials -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"TestPass123"}' -v
curl -X GET https://gear-score.com/api/auth/csrf -v
curl -s https://gear-score.com/api/auth/csrf
curl -s https://gear-score.com/api/auth/csrf | jq .
curl -X POST https://gear-score.com/api/auth/callback/credentials -H "Content-Type: application/x-www-form-urlencoded" -d "email=test@example.com&password=TestPass123&csrfToken=6b28586352e2ce6a158fab031ac916aa570f9b8694b1b0911db3c959e3522ff6" -v
pm2 restart server
curl -X POST https://gear-score.com/api/auth/callback/credentials -H "Content-Type: application/x-www-form-urlencoded" -d "email=test@example.com&password=TestPass123&redirect=false" -v
pm2 logs server --lines 50 --raw
curl -X POST https://gear-score.com/api/register   -H "Content-Type: application/json"   -d '{"email":"test@example.com","password":"TestPass123","username":"testuser"}'   -v
curl -X POST https://gear-score.com/api/register   -H "Content-Type: application/json"   -d '{"email":"test@example.com","password":"TestPass123","username":"testuser"}'   -s | jq .
curl -X POST https://gear-score.com/api/register   -H "Content-Type: application/json"   -d '{"email":"newtest$(date +%s)@example.com","password":"TestPass123","username":"newuser$(date +%s)"}'   -s | jq .
TIMESTAMP=$(date +%s)
curl -X POST https://gear-score.com/api/register   -H "Content-Type: application/json"   -d "{\"email\":\"newtest${TIMESTAMP}@example.com\",\"password\":\"TestPass123\",\"username\":\"newuser${TIMESTAMP}\"}"   -s | jq .
curl -X POST https://gear-score.com/api/register   -H "Content-Type: application/json"   -d '{"email":"testuser123@gmail.com","password":"TestPass123","username":"testuser123"}'   -s
curl -X POST https://gear-score.com/api/register -H "Content-Type: application/json" -d '{"email":"testuser123@gmail.com","password":"TestPass123","username":"testuser123"}' -i
curl -X POST https://gear-score.com/api/register -H "Content-Type: application/json" -d '{"email":"testuser123@gmail.com","password":"TestPass123","username":"testuser123"}' -s | cat
curl -X POST https://gear-score.com/api/register -H "Content-Type: application/json" -d '{"email":"uniquetest$(date +%s)@example.com","password":"TestPass123","username":"uniqueuser$(date +%s)"}' 2>/dev/null
TIMESTAMP=$(date +%s) && curl -X POST https://gear-score.com/api/register -H "Content-Type: application/json" -d "{\"email\":\"test${TIMESTAMP}@example.com\",\"password\":\"TestPass123\",\"username\":\"test${TIMESTAMP}\"}" 2>/dev/null
curl -X POST https://gear-score.com/api/register -H "Content-Type: application/json" -d '{"email":"test999@example.com","password":"TestPass123","username":"test999"}' && echo
curl -X POST https://gear-score.com/api/auth/callback/credentials -H "Content-Type: application/json" -d '{"email":"test999@example.com","password":"TestPass123","csrfToken":"test"}' -i
npm run build
npm run dev
lsof -ti:3000 | xargs kill -9
npm run dev
netstat -tulpn | grep :3000
kill -9 623577
npm run dev
PORT=3001 npm run dev
node server.js 3001
npx prisma db push
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.findMany().then(users => { console.log('Users in database:', users.length); users.forEach(user => console.log('- Email:', user.email, 'Verified:', npx prisma db pushuser.emailVerified, 'HasPassword:', npx prisma db pushuser.password)); }).catch(console.error).finally(() => prisma.$disconnect());"
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.findMany().then(users => console.log('Users:', users.map(u => ({email: u.email, verified: node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.findMany().then(users => { console.log('Users in database:', users.length); users.forEach(user => console.log('- Email:', user.email, 'Verified:', npx prisma db pushuser.emailVerified, 'HasPassword:', npx prisma db pushuser.password)); }).catch(console.error).finally(() => prisma.$disconnect());"u.emailVerified, hasPassword: node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.user.findMany().then(users => { console.log('Users in database:', users.length); users.forEach(user => console.log('- Email:', user.email, 'Verified:', npx prisma db pushuser.emailVerified, 'HasPassword:', npx prisma db pushuser.password)); }).catch(console.error).finally(() => prisma.$disconnect());"u.password})))).catch(console.error).finally(() => prisma.\$disconnect());"
node check-users.js
node test-login.js
node create-test-user.js
node test-login-api.js
npm install node-fetch@2
node test-nextauth-api.js
node test-complete-login.js
node test-login-with-logs.js
node test-authorize-function.js
node test-nextauth-signin.js
node -e "console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL); console.log('NODE_ENV:', process.env.NODE_ENV);"
node -e "require('dotenv').config({ path: '.env.local' }); require('dotenv').config(); console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL); console.log('NODE_ENV:', process.env.NODE_ENV);"
node test-nextauth-signin.js
node test-browser-login.js
node create-test-user.js
node test-credentials-provider.js
node debug-nextauth-config.js
node test-direct-nextauth.js
node test-new-auth.js
node test-custom-auth.js
node check-database-users.js
node test-custom-auth.js
node create-auth-test-user.js
node test-custom-auth.js
node test-registration-system.js
node test-registration-final.js
node test-logout-system.js
node test-logout-improved.js
node test-frontend-logout.js
node test-logout-detailed.js
node test-new-login-system.js
node test-oauth-providers.js
node setup-oauth-providers.js
npm run dev
npm run dev -- --port 3001
node server.js 3001
pm2 restart all
PORT=3000 NODE_ENV=production node server.js
pm2 restart all
npm run build
ps aux | grep node
netstat -tlnp | grep :3000
tail -n 20 /var/log/syslog | grep node
ls -la logs/
tail -n 50 logs/error-2025-08-12.log
curl -I http://localhost:3000
kill -0 889098 && echo "Process is running" || echo "Process is not running"
netstat -tlnp | grep 889098
curl -I http://localhost:3001
curl -I https://gear-score.com
nginx -t
cat /etc/nginx/sites-available/gear-score.com
head -n 30 /etc/nginx/sites-available/gear-score.com
sudo sed -i 's/127.0.0.1:3000/127.0.0.1:3001/g' /etc/nginx/sites-available/gear-score.com
grep "127.0.0.1:" /etc/nginx/sites-available/gear-score.com
sudo nginx -t
sudo systemctl reload nginx
curl -I https://gear-score.com
curl -I https://www.gear-score.com
tail -n 100 logs/error-2025-08-12.log | grep -i "auth\|session\|token\|login\|logout"
grep -E "JWT_SECRET|NEXTAUTH_SECRET|NEXTAUTH_URL" .env* 2>/dev/null || echo "No .env files found or variables not set"
pkill -f "node.*next"
ps aux | grep node
kill 889098
npm run start
lsof -i :3000
kill 917987
npm run start
netstat -tlnp | grep :3000
kill 919631
npm run start
PORT=3002 npm run start
npm run build
npx prisma db push
node -e "const { PrismaClient } = require('@prisma/client'); const bcrypt = require('bcrypt'); const prisma = new PrismaClient(); async function createTestUser() { try { const hashedPassword = await bcrypt.hash('TestPass123', 12); const user = await prisma.user.create({ data: { email: 'test@gear-score.com', name: 'Test User', password: hashedPassword, role: 'USER', emailVerified: new Date() } }); console.log('✅ Test user created:', user.email); } catch (error) { if (error.code === 'P2002') { console.log('ℹ️ Test user already exists'); } else { console.error('❌ Error:', error.message); } } finally { await prisma.$disconnect(); } } createTestUser();"
node create-test-user-auth.js
node test-auth-system.js
node debug-registration.js
node test-frontend-registration.js
npm run build
node simulate-frontend-issue.js
npm run build
node final-registration-test.js
npm run build
node test-login-fix.js
node create-test-user.js
node test-login-fix.js
pm2 restart all
npm run build
node test-logout-fix.js
npm run build
node test-logout-fix.js
npx prisma db push
npx prisma generate
npm run build
node test-logout-fix.js
npx prisma generate
npm run build
sed -i 's/127.0.0.1:3001/127.0.0.1:3002/g' /etc/nginx/sites-available/gear-score.com
sudo nginx -t && sudo systemctl reload nginx
curl -I https://gear-score.com
npm run build
lsof -i :3002
kill 926779
curl -I https://gear-score.com
npm run build
lsof -i :3002
kill 935093
curl -I https://gear-score.com
tail -50 /var/log/nginx/error.log
pm2 logs --lines 50
pm2 stop all
rm -rf .next && npm run build
pm2 start ecosystem.config.js
npm start
pm2 status
pm2 start all
pm2 status
npm start
lsof -i :3000
kill -9 1054433
npm start
lsof -i :3000
pkill -f node
cat /etc/nginx/sites-available/gear-score.com
sudo sed -i 's/127.0.0.1:3002/127.0.0.1:3001/g' /etc/nginx/sites-available/gear-score.com
sudo nginx -t && sudo systemctl reload nginx
curl -I https://gear-score.com/auth
curl -X POST https://gear-score.com/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"testpassword"}' -v
node -e "const bcrypt = require('bcrypt'); const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function createTestUser() { const hashedPassword = await bcrypt.hash('testpassword123', 12); const user = await prisma.user.create({ data: { email: 'test@gear-score.com', password: hashedPassword, username: 'testuser', name: 'Test User', emailVerified: new Date(), role: 'USER' } }); console.log('Test user created:', user.email); await prisma.$disconnect(); } createTestUser().catch(console.error);"
node create-test-user-login.js
curl -X POST https://gear-score.com/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@gear-score.com","password":"testpassword123"}' -s | jq .
node -e "const bcrypt = require('bcrypt'); const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function updatePassword() { const hashedPassword = await bcrypt.hash('testpassword123', 12); await prisma.user.update({ where: { email: 'test@gear-score.com' }, data: { password: hashedPassword } }); console.log('Password updated for test user'); await prisma.\$disconnect(); } updatePassword().catch(console.error);"
curl -X POST https://gear-score.com/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@gear-score.com","password":"testpassword123"}' -s | jq .
node test-arabic-login.js
node test-performance-optimizations.js
pm2 restart all
node test-navigation-fix.js
pm2 restart all
node test-navigation-fix.js
node test-game-pages-fix.js
npm install puppeteer
node test-game-pages-fix.js
pm2 restart all
node test-discord-oauth.js
pm2 restart all
node test-discord-redirect-uri.js
pm2 restart all
lsof -ti:3001 | xargs kill -9
node -e "const fetch = require('node-fetch'); async function testRegistration() { try { const response = await fetch('http://localhost:3001/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'test@example.com', password: 'TestPass123', username: 'testuser' }) }); const data = await response.json(); console.log('Status:', response.status); console.log('Response:', JSON.stringify(data, null, 2)); } catch (error) { console.error('Error:', error.message); } } testRegistration();"
node -e "const fetch = require('node-fetch'); async function testRegistration() { try { const testEmail = 'test' + Date.now() + '@example.com'; const response = await fetch('http://localhost:3001/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: testEmail, password: 'TestPass123', username: 'user' + Date.now() }) }); const data = await response.json(); console.log('Status:', response.status); console.log('Response:', JSON.stringify(data, null, 2)); } catch (error) { console.error('Error:', error.message); } } testRegistration();"
node -e "const fetch = require('node-fetch'); async function testLogin() { try { const response = await fetch('http://localhost:3001/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'test1754979059156@example.com', password: 'TestPass123' }) }); const data = await response.json(); console.log('Login Status:', response.status); console.log('Login Response:', JSON.stringify(data, null, 2)); } catch (error) { console.error('Login Error:', error.message); } } testLogin();"
pkill -f "PORT=3001" || true
lsof -ti:3001 | xargs kill -9 || true
node -e "const fetch = require('node-fetch'); async function testRegistration() { try { const testEmail = 'newtest' + Date.now() + '@example.com'; const testUsername = 'newuser' + Date.now(); const response = await fetch('http://localhost:3001/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: testEmail, password: 'TestPass123', username: testUsername }) }); const data = await response.json(); console.log('Registration Status:', response.status); console.log('Registration Response:', JSON.stringify(data, null, 2)); if (data.success && data.message.includes('immediately')) { console.log('\n✅ Testing login with new user...'); const loginResponse = await fetch('http://localhost:3001/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: testEmail, password: 'TestPass123' }) }); const loginData = await loginResponse.json(); console.log('Login Status:', loginResponse.status); console.log('Login Response:', JSON.stringify(loginData, null, 2)); } } catch (error) { console.error('Error:', error.message); } } testRegistration();"
npm install web-vitals
node -e "const fetch = require('node-fetch'); async function testRegistration() { try { const testEmail = 'newtest' + Date.now() + '@example.com'; const testUsername = 'newuser' + Date.now(); console.log('Testing registration with:', testEmail); const response = await fetch('http://localhost:3001/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: testEmail, password: 'TestPass123', username: testUsername }) }); console.log('Registration Status:', response.status); const contentType = response.headers.get('content-type'); console.log('Content-Type:', contentType); if (contentType && contentType.includes('application/json')) { const data = await response.json(); console.log('Registration Response:', JSON.stringify(data, null, 2)); if (data.success) { console.log('\n✅ Testing login with new user...'); const loginResponse = await fetch('http://localhost:3001/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: testEmail, password: 'TestPass123' }) }); const loginData = await loginResponse.json(); console.log('Login Status:', loginResponse.status); console.log('Login Response:', JSON.stringify(loginData, null, 2)); } } else { const text = await response.text(); console.log('Non-JSON Response:', text.substring(0, 500)); } } catch (error) { console.error('Error:', error.message); } } testRegistration();"
kill -9 1057000
lsof -i :3000
kill -9 1057618
npm start
PORT=3001 npm start
