import { writeFileSync } from 'fs';
import { join } from 'path';
const contractsInfoPath = "./scripts/contractsInfo"
const addresses = {"abc": "123"};
writeFileSync(join(contractsInfoPath, "/test.json"), JSON.stringify(addresses, null, 2));