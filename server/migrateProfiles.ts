import { db } from "./db";
import { sql } from "drizzle-orm";

/**
 * One-time migration to consolidate duplicate profiles
 * 
 * For each userId that has multiple profiles:
 * 1. Keep the most recent profile (UUID-based ID)
 * 2. Update all FK references to point to the canonical profile
 * 3. Delete the old duplicate profile
 */

const PROFILE_MAPPINGS = {
  // Map old profile ID → new canonical profile ID
  'demo-vibe-coder-1': '35a4c947-ac0e-41df-89a5-dfd69ce37ea2',
  'test-member-1': 'ad985644-0797-4d74-8278-5903ce892036',
  'test-member-2': 'b4a8e5b2-417b-45f4-8019-d066f9f1f52b',
};

export async function migrateProfiles() {
  console.log('Starting profile consolidation migration...');
  
  for (const [oldId, newId] of Object.entries(PROFILE_MAPPINGS)) {
    console.log(`Migrating ${oldId} → ${newId}...`);
    
    try {
      await db.transaction(async (tx) => {
        // Update projects.vibe_coder_id (already done earlier, but ensuring)
        await tx.execute(sql`
          UPDATE projects 
          SET vibe_coder_id = ${newId}
          WHERE vibe_coder_id = ${oldId}
        `);
        
        // Update tasks.created_by
        await tx.execute(sql`
          UPDATE tasks 
          SET created_by = ${newId}
          WHERE created_by = ${oldId}
        `);
        
        // Update tasks.assigned_to
        await tx.execute(sql`
          UPDATE tasks 
          SET assigned_to = ${newId}
          WHERE assigned_to = ${oldId}
        `);
        
        // Update project_members.profile_id
        await tx.execute(sql`
          UPDATE project_members 
          SET profile_id = ${newId}
          WHERE profile_id = ${oldId}
        `);
        
        // Update contributions.contributor_id
        await tx.execute(sql`
          UPDATE contributions 
          SET contributor_id = ${newId}
          WHERE contributor_id = ${oldId}
        `);
        
        // Update matches (both initiator and receiver)
        await tx.execute(sql`
          UPDATE matches 
          SET initiator_id = ${newId}
          WHERE initiator_id = ${oldId}
        `);
        
        await tx.execute(sql`
          UPDATE matches 
          SET receiver_id = ${newId}
          WHERE receiver_id = ${oldId}
        `);
        
        // Finally, delete the old duplicate profile
        await tx.execute(sql`
          DELETE FROM profiles 
          WHERE id = ${oldId}
        `);
        
        console.log(`✓ Successfully migrated ${oldId}`);
      });
    } catch (error) {
      console.error(`✗ Failed to migrate ${oldId}:`, error);
      throw error;
    }
  }
  
  console.log('Profile consolidation complete!');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateProfiles()
    .then(() => {
      console.log('Migration successful');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
