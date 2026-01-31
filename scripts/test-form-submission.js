// Test Form Submission to Railway Database
// This script will test adding data to the database

const mysql = require('mysql2/promise');

async function testFormSubmission() {
    console.log('🔍 Testing form submission to Railway database...');
    
    const config = {
        host: 'turntable.proxy.rlwy.net',
        port: 12096,
        user: 'root',
        password: 'lTatesqgMIzyrKwiJGDVyJNrJgbQmpNe',
        database: 'railway',
        charset: 'utf8mb4'
    };
    
    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ Connected to Railway database');
        
        // Test adding a new vehicle
        console.log('\n🚗 Testing vehicle insertion...');
        const testVehicle = {
            id: 999,
            plate_number: 'TEST 123',
            vehicle_type: 'Bus',
            model: 'Test Model',
            manufacture_year: 2023,
            capacity: 25,
            status: 'Active',
            fuel_type: 'Diesel',
            next_maintenance_date: '2026-06-01'
        };
        
        const [result] = await connection.execute(`
            INSERT INTO vehicles (
                id, plate_number, vehicle_type, model, manufacture_year, capacity,
                status, fuel_type, next_maintenance_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            testVehicle.id,
            testVehicle.plate_number,
            testVehicle.vehicle_type,
            testVehicle.model,
            testVehicle.manufacture_year,
            testVehicle.capacity,
            testVehicle.status,
            testVehicle.fuel_type,
            testVehicle.next_maintenance_date
        ]);
        
        console.log(`✅ Vehicle inserted successfully! ID: ${result.insertId}`);
        
        // Test adding a new driver
        console.log('\n👨‍💼 Testing driver insertion...');
        const testDriver = {
            id: 999,
            full_name: 'Test Driver',
            license_number: 'TEST-001',
            phone_number: '255-123-456789',
            email: 'test@nit.ac.tz',
            experience_years: 5,
            license_expiry: '2025-12-31',
            status: 'Active'
        };
        
        const [driverResult] = await connection.execute(`
            INSERT INTO drivers (
                id, full_name, license_number, phone_number, email, 
                experience_years, license_expiry, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            testDriver.id,
            testDriver.full_name,
            testDriver.license_number,
            testDriver.phone_number,
            testDriver.email,
            testDriver.experience_years,
            testDriver.license_expiry,
            testDriver.status
        ]);
        
        console.log(`✅ Driver inserted successfully! ID: ${driverResult.insertId}`);
        
        // Test adding a new trip
        console.log('\n🛣️ Testing trip insertion...');
        const testTrip = {
            id: 999,
            route_from: 'Test Origin',
            route_to: 'Test Destination',
            driver_id: 999,
            vehicle_id: 999,
            trip_date: '2026-01-31',
            departure_time: '10:00',
            arrival_time: '12:00',
            distance_km: 30.5,
            fuel_consumed: 10.2,
            passenger_count: 20,
            notes: 'Test trip',
            status: 'Scheduled'
        };
        
        const [tripResult] = await connection.execute(`
            INSERT INTO trips (
                id, route_from, route_to, driver_id, vehicle_id, trip_date,
                departure_time, arrival_time, distance_km, fuel_consumed,
                passenger_count, notes, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            testTrip.id,
            testTrip.route_from,
            testTrip.route_to,
            testTrip.driver_id,
            testTrip.vehicle_id,
            testTrip.trip_date,
            testTrip.departure_time,
            testTrip.arrival_time,
            testTrip.distance_km,
            testTrip.fuel_consumed,
            testTrip.passenger_count,
            testTrip.notes,
            testTrip.status
        ]);
        
        console.log(`✅ Trip inserted successfully! ID: ${tripResult.insertId}`);
        
        // Verify the data was inserted
        console.log('\n📊 Verifying inserted data...');
        const [vehicles] = await connection.execute('SELECT * FROM vehicles WHERE plate_number = ?', [testVehicle.plate_number]);
        const [drivers] = await connection.execute('SELECT * FROM drivers WHERE license_number = ?', [testDriver.license_number]);
        const [trips] = await connection.execute('SELECT * FROM trips WHERE id = ?', [tripResult.insertId]);
        
        console.log(`✅ Vehicles found: ${vehicles.length}`);
        console.log(`✅ Drivers found: ${drivers.length}`);
        console.log(`✅ Trips found: ${trips.length}`);
        
        if (vehicles.length > 0) {
            console.log('\n📋 Sample inserted vehicle:');
            console.log(JSON.stringify(vehicles[0], null, 2));
        }
        
        await connection.end();
        console.log('\n✅ Form submission test completed successfully!');
        console.log('🚀 Database insertion is working correctly!');
        
    } catch (error) {
        console.error('❌ Form submission test failed:', error.message);
        console.error('🔧 Error details:', error);
        process.exit(1);
    }
}

testFormSubmission();
