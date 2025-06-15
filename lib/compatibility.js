// lib/compatibility.js - Fixed compatibility functions
import { supabase } from './database';

export async function getCompatibilityReports() {
  try {
    const { data, error } = await supabase
      .from('compatibility_reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching compatibility reports:', error);
    return [];
  }
}

export async function createCompatibilityReport(report) {
  try {
    // Validate required fields
    const requiredFields = ['user_id', 'crankset_id', 'cassette_id', 'derailleur_id', 'is_compatible'];
    for (const field of requiredFields) {
      if (report[field] === undefined || report[field] === null) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    const { data, error } = await supabase
      .from('compatibility_reports')
      .insert([report])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating compatibility report:', error);
    throw error;
  }
}

// Enhanced compatibility validation
export function validateComponentCompatibility(crankset, cassette, derailleur) {
  const issues = [];
  const warnings = [];
  
  try {
    // Speed compatibility check
    const crankSpeed = parseInt(crankset.speeds?.split('-')[0] || '11');
    const cassetteSpeed = parseInt(cassette.speeds?.split('-')[0] || '11');
    const rdSpeed = parseInt(derailleur.speeds?.split('-')[0] || '11');
    
    if (cassetteSpeed !== rdSpeed) {
      issues.push(`Speed mismatch: Cassette is ${cassetteSpeed}-speed, derailleur is ${rdSpeed}-speed`);
    }
    
    // Max cog capacity check
    const maxCassetteCog = Math.max(...(cassette.teeth || [34]));
    const rdMaxCog = derailleur.maxCog || 34;
    
    if (maxCassetteCog > rdMaxCog) {
      issues.push(`Derailleur max cog (${rdMaxCog}T) is smaller than cassette max cog (${maxCassetteCog}T)`);
    }
    
    // Brand mixing warnings
    const crankBrand = crankset.model?.toLowerCase().includes('shimano') ? 'shimano' : 'sram';
    const cassetteBrand = cassette.model?.toLowerCase().includes('shimano') ? 'shimano' : 'sram';
    const rdBrand = derailleur.model?.toLowerCase().includes('shimano') ? 'shimano' : 'sram';
    
    const brands = new Set([crankBrand, cassetteBrand, rdBrand]);
    if (brands.size > 1) {
      warnings.push('Mixed brands detected - may require additional adjustment');
    }
    
    // Electronic compatibility
    if (derailleur.isElectronic && !derailleur.isWireless) {
      warnings.push('Electronic derailleur requires Di2 battery and wiring');
    }
    
    if (derailleur.isWireless) {
      warnings.push('Wireless derailleur requires battery maintenance and pairing');
    }
    
    // 1x vs 2x setup
    const is1x = crankset.teeth?.length === 1;
    if (is1x && !derailleur.variant?.includes('1x') && derailleur.bikeType === 'mtb') {
      warnings.push('1x crankset with non-1x MTB derailleur - verify clutch settings');
    }
    
    return {
      isCompatible: issues.length === 0,
      issues,
      warnings,
      confidence: issues.length === 0 ? (warnings.length === 0 ? 'high' : 'medium') : 'low'
    };
    
  } catch (error) {
    console.error('Compatibility validation error:', error);
    return {
      isCompatible: false,
      issues: ['Unable to validate compatibility'],
      warnings: [],
      confidence: 'low'
    };
  }
}