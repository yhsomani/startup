from app.models import Challenge

# Check if evaluationMetric field exists
def check_model_fields():
    fields = [attr for attr in dir(Challenge) if not attr.startswith('_')]
    required_fields = ['title', 'description', 'evaluationMetric', 'dataset_url', 'passingScore', 'testCases', 'language']
    print('Model fields:', fields)
    
    missing_fields = [field for field in required_fields if field not in fields]
    if missing_fields:
        print('❌ Missing required fields:', missing_fields)
    
    # Check for field name mismatches
    field_name_map = {
        'title': 'title',
        'description': 'description', 
        'evaluationMetric': 'evaluationMetric',
        'dataset_url': 'datasetUrl',
        'passingScore': 'passingScore',
        'test_cases': 'testCases',
        'language': 'language'
    }
    
    print('Checking for field name mismatches...')
    success = True
    for attr in fields:
        if attr in field_name_map:
            expected = field_name_map[attr]
            actual = attr
            if expected != actual:
                print(f'  ⚠ Field name mismatch: {attr} should be {expected}')
                success = False
    
    return success

if __name__ == '__main__':
    check_model_fields()