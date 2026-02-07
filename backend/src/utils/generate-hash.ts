import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.log("Uso: npm run generate-hash <senha>");
  console.log("Exemplo: npm run generate-hash minha-senha-segura");
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log("\n🔐 Hash bcrypt gerado:");
  console.log(hash);
  console.log("\nCole este valor na variável AUTH_PASSWORD do .env");
});
