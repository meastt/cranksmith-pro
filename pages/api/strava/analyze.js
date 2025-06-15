// pages/api/strava/analyze.js
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/session';

export default withIronSessionApiRoute(handler, sessionOptions);

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { crankset, cassette } = req.body;
    const { stravaToken, stravaTokenExpiry } = req.session;

    if (!stravaToken) {
      return res.status(401).json({ error: 'Not authenticated with Strava' });
    }

    // Check if token is expired
    if (stravaTokenExpiry && Date.now() > stravaTokenExpiry) {
      // TODO: Implement token refresh
      return res.status(401).json({ error: 'Strava token expired' });
    }

    let activities = [];

    // For demo purposes, allow demo token
    if (stravaToken === 'demo_token') {
      activities = generateDemoActivities();
    } else {
      // Fetch real activities from Strava
      console.log('Fetching real Strava data...');
      
      const activitiesResponse = await fetch(
        'https://www.strava.com/api/v3/athlete/activities?per_page=50',
        {
          headers: { 'Authorization': `Bearer ${stravaToken}` }
        }
      );

      if (!activitiesResponse.ok) {
        console.error('Strava API error:', activitiesResponse.status, activitiesResponse.statusText);
        
        // If unauthorized, clear session
        if (activitiesResponse.status === 401) {
          delete req.session.stravaToken;
          await req.session.save();
          return res.status(401).json({ error: 'Strava authentication expired' });
        }
        
        throw new Error(`Failed to fetch Strava activities: ${activitiesResponse.status}`);
      }

      activities = await activitiesResponse.json();
      console.log(`Fetched ${activities.length} activities from Strava`);
    }
    
    // Filter for bike rides only
    const bikeRides = activities.filter(activity => 
      activity.type === 'Ride' && activity.gear_id
    );

    // Analyze gear usage patterns
    const gearAnalysis = analyzeGearUsage(bikeRides, crankset, cassette);
    
    // Generate recommendations
    const recommendations = generateRecommendations(gearAnalysis, crankset, cassette);

    res.status(200).json({
      totalRides: bikeRides.length,
      analyzedDistance: bikeRides.reduce((sum, ride) => sum + ride.distance, 0),
      gearAnalysis,
      recommendations,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Strava analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
}

// Copy all the helper functions from your original analyze.js file below:
function analyzeGearUsage(rides, crankset, cassette) {
  // [Copy the entire function from your original file]
  const gearRatios = generateGearRatios(crankset, cassette);
  const usageData = {};
  
  // Initialize usage counters
  gearRatios.forEach(gear => {
    usageData[gear.combo] = {
      ratio: gear.ratio,
      timeUsed: 0,
      distanceUsed: 0,
      powerSessions: 0,
      avgPower: 0,
      terrainTypes: []
    };
  });

  // Simulate usage patterns based on ride characteristics
  rides.forEach(ride => {
    const rideAnalysis = categorizeRide(ride);
    
    // Distribute usage across gears based on ride type
    const gearDistribution = getGearDistributionForRide(rideAnalysis, gearRatios);
    
    Object.entries(gearDistribution).forEach(([gearCombo, usage]) => {
      if (usageData[gearCombo]) {
        usageData[gearCombo].timeUsed += ride.moving_time * usage.percentage;
        usageData[gearCombo].distanceUsed += ride.distance * usage.percentage;
        if (ride.average_watts) {
          usageData[gearCombo].powerSessions++;
          usageData[gearCombo].avgPower = 
            (usageData[gearCombo].avgPower + ride.average_watts) / 2;
        }
        usageData[gearCombo].terrainTypes.push(rideAnalysis.terrainType);
      }
    });
  });

  // Calculate percentages and identify unused gears
  const totalTime = Object.values(usageData).reduce((sum, gear) => sum + gear.timeUsed, 0);
  const analysis = Object.entries(usageData).map(([combo, data]) => ({
    gearCombo: combo,
    ratio: data.ratio,
    usagePercentage: totalTime > 0 ? (data.timeUsed / totalTime) * 100 : 0,
    timeUsed: Math.round(data.timeUsed / 60), // Convert to minutes
    distanceUsed: Math.round(data.distanceUsed / 1000), // Convert to km
    avgPower: Math.round(data.avgPower),
    isUnused: data.timeUsed < 30, // Less than 30 seconds total
    isRarelyUsed: data.timeUsed < 300, // Less than 5 minutes total
    primaryTerrain: getMostCommonTerrain(data.terrainTypes)
  }));

  return analysis.sort((a, b) => b.usagePercentage - a.usagePercentage);
}

function categorizeRide(ride) {
  const avgSpeed = ride.average_speed * 3.6; // Convert m/s to km/h
  const elevationGain = ride.total_elevation_gain;
  const distance = ride.distance / 1000; // Convert to km
  
  let terrainType = 'flat';
  let rideIntensity = 'moderate';
  
  // Categorize terrain
  if (elevationGain > distance * 15) {
    terrainType = 'hilly';
  } else if (elevationGain > distance * 8) {
    terrainType = 'rolling';
  }
  
  // Categorize intensity
  if (avgSpeed > 35) {
    rideIntensity = 'high';
  } else if (avgSpeed < 25) {
    rideIntensity = 'low';
  }
  
  return { terrainType, rideIntensity, avgSpeed, elevationGain, distance };
}

function getGearDistributionForRide(rideAnalysis, gearRatios) {
  const distribution = {};
  
  // Define gear preferences based on terrain and intensity
  gearRatios.forEach(gear => {
    let baseUsage = 0.02; // 2% base usage for all gears
    
    // Adjust based on terrain
    if (rideAnalysis.terrainType === 'hilly') {
      // Prefer easier gears (higher ratios are harder)
      baseUsage += gear.ratio < 2.5 ? 0.15 : 0.02;
    } else if (rideAnalysis.terrainType === 'flat') {
      // Prefer harder gears for flats
      baseUsage += gear.ratio > 3.0 ? 0.12 : 0.03;
    }
    
    // Adjust based on intensity
    if (rideAnalysis.rideIntensity === 'high') {
      baseUsage += gear.ratio > 3.5 ? 0.1 : 0.02;
    }
    
    distribution[gear.combo] = {
      percentage: Math.min(baseUsage, 0.25) // Cap at 25% for any single gear
    };
  });
  
  return distribution;
}

function generateGearRatios(crankset, cassette) {
  const ratios = [];
  const [smallCog, largeCog] = [Math.min(...cassette.teeth), Math.max(...cassette.teeth)];
  const speeds = parseInt(cassette.speeds);
  const cogs = generateCogProgression(smallCog, largeCog, speeds);
  
  crankset.teeth.forEach(chainring => {
    cogs.forEach(cog => {
      ratios.push({
        combo: `${chainring}x${cog}`,
        chainring,
        cog,
        ratio: chainring / cog
      });
    });
  });
  
  return ratios.sort((a, b) => a.ratio - b.ratio);
}

function generateCogProgression(smallest, largest, speeds) {
  const cogs = [];
  const ratio = Math.pow(largest / smallest, 1 / (speeds - 1));
  
  for (let i = 0; i < speeds; i++) {
    cogs.push(Math.round(smallest * Math.pow(ratio, i)));
  }
  
  return cogs;
}

function getMostCommonTerrain(terrainTypes) {
  if (terrainTypes.length === 0) return 'unknown';
  
  const counts = {};
  terrainTypes.forEach(terrain => {
    counts[terrain] = (counts[terrain] || 0) + 1;
  });
  
  return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0];
}

function generateRecommendations(gearAnalysis, crankset, cassette) {
  const recommendations = [];
  const unusedGears = gearAnalysis.filter(gear => gear.isUnused);
  const rarelyUsedGears = gearAnalysis.filter(gear => gear.isRarelyUsed && !gear.isUnused);
  const mostUsedGears = gearAnalysis.slice(0, 5);
  
  // Unused gears
  if (unusedGears.length > 0) {
    recommendations.push({
      type: 'unused_gears',
      priority: 'high',
      title: `${unusedGears.length} gears never used`,
      description: `You never used: ${unusedGears.map(g => g.gearCombo).join(', ')}`,
      suggestion: 'Consider a smaller cassette range or different chainring sizes',
      savings: 'Potential weight savings: ~50-100g'
    });
  }
  
  // Rarely used gears
  if (rarelyUsedGears.length > 3) {
    recommendations.push({
      type: 'rarely_used',
      priority: 'medium',
      title: `${rarelyUsedGears.length} gears rarely used`,
      description: `Minimal usage: ${rarelyUsedGears.slice(0, 3).map(g => g.gearCombo).join(', ')}`,
      suggestion: 'Your current range might be too wide for your riding style'
    });
  }
  
  // Top gear insights
  const topGear = mostUsedGears[0];
  if (topGear && topGear.usagePercentage > 15) {
    recommendations.push({
      type: 'top_gear',
      priority: 'info',
      title: `${topGear.gearCombo} is your go-to gear`,
      description: `Used ${topGear.usagePercentage.toFixed(1)}% of the time`,
      suggestion: 'This suggests good gear selection for your riding style'
    });
  }
  
  // Gear gaps
  const sortedByRatio = gearAnalysis
    .filter(gear => gear.usagePercentage > 2)
    .sort((a, b) => a.ratio - b.ratio);
    
  for (let i = 0; i < sortedByRatio.length - 1; i++) {
    const current = sortedByRatio[i];
    const next = sortedByRatio[i + 1];
    const gap = (next.ratio - current.ratio) / current.ratio;
    
    if (gap > 0.15) { // 15% gap
      recommendations.push({
        type: 'gear_gap',
        priority: 'medium',
        title: `Large gap between ${current.gearCombo} and ${next.gearCombo}`,
        description: `${Math.round(gap * 100)}% ratio jump`,
        suggestion: 'Consider cassette with tighter spacing'
      });
    }
  }
  
  return recommendations.sort((a, b) => {
    const priority = { high: 3, medium: 2, low: 1, info: 0 };
    return priority[b.priority] - priority[a.priority];
  });
}

function generateDemoActivities() {
  const activities = [];
  const now = new Date();
  
  for (let i = 0; i < 25; i++) {
    const date = new Date(now.getTime() - (i * 2 * 24 * 60 * 60 * 1000)); // Every 2 days
    
    activities.push({
      id: `demo_${i}`,
      name: `${['Morning Ride', 'Lunch Loop', 'Evening Cruise', 'Weekend Adventure'][i % 4]}`,
      type: 'Ride',
      gear_id: 'bike_1',
      distance: Math.random() * 50000 + 10000, // 10-60km in meters
      moving_time: Math.random() * 7200 + 1800, // 30min - 2.5hr in seconds
      total_elevation_gain: Math.random() * 800 + 50, // 50-850m elevation
      average_speed: Math.random() * 10 + 6, // 6-16 m/s
      average_watts: Math.random() * 100 + 150, // 150-250W
      start_date: date.toISOString()
    });
  }
  
  return activities;
}