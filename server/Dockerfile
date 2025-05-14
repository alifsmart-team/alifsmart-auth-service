# Backend Image
# Gunakan Node.js sebagai base image
FROM node:18-alpine

# Set working directory di dalam container
WORKDIR /app/backend

# Salin package.json dan package-lock.json (atau yarn.lock) terlebih dahulu untuk memanfaatkan caching layer
COPY backend/package*.json ./

# Instal dependencies backend
RUN npm install --production

# Salin seluruh kode backend
COPY backend/. .

# Salin file .env jika ada
COPY backend/.env .

# Expose port yang digunakan oleh backend Anda (ganti dengan port sebenarnya)
EXPOSE 5000

# Command untuk menjalankan aplikasi backend Anda
CMD [ "node", "server.js" ]