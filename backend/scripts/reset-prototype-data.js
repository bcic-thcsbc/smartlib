const initDatabase = require('../database/initDatabase');
const { transaction, run } = require('../database/db');
async function main() {
  await initDatabase();
  await transaction(async()=>{
    for (const table of ['sessions','notifications','audit_logs','copy_incidents','borrow_items','borrows','reservation_slots','borrow_requests','book_copies','books','users']) await run(`DELETE FROM ${table}`);
    await run("DELETE FROM sqlite_sequence WHERE name IN ('users','books','book_copies','borrow_requests','reservation_slots','borrows','borrow_items','copy_incidents','notifications','audit_logs')");
  });
  console.log('Prototype data removed. Schema and school settings were preserved.');
}
main().catch(error=>{console.error(error);process.exitCode=1});
