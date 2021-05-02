import generate_box_charts
import generate_one_run_charts

result_file = '48'

box_datasets = []  # ['1', '5', '15', '75']  # ['1', '25', '45']


# line_networks = ['11']
line_networks = ['00', '01', '02', '10', '11', '12', '20', '21', '22']
# line_networks += ['Regular 3G', 'Slow 3G', '4G', 'Cable']
print(line_networks)
for box_dataset in box_datasets:
    generate_box_charts.plot_boxes(result_file, box_dataset)

for line_network in line_networks:
    generate_one_run_charts.plot_lines(result_file, line_network)
